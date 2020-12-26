import { once } from "lodash-es"
import { pivot, find, getSingle } from "utils"
import BaseForme from "./BaseForme"
import { getGeometry } from "math/operations/operationUtils"
import { Composite } from "specs"
import { Polyhedron, Face, Cap } from "math/polyhedra"
import { getCentroid } from "math/geom"
import { FaceType, ClassicalFace, CapstoneFace } from "./FaceType"
import ClassicalForme from "./ClassicalForme"

type Base = Cap | Face

export default abstract class CompositeForme extends BaseForme<Composite> {
  static create(specs: Composite, geom: Polyhedron) {
    // TODO lol maybe it's time for a visitor
    if (specs.isAugmentedPrism()) {
      return new AugmentedPrismForme(specs, geom)
    } else if (specs.isAugmentedClassical()) {
      return new AugmentedClassicalForme(specs, geom)
    } else if (specs.isDiminishedSolid()) {
      return new DiminishedSolidForme(specs, geom)
    } else if (specs.isGyrateSolid()) {
      return new GyrateSolidForme(specs, geom)
    }
    throw new Error(`Invalid composite specs: ${specs.name()}`)
  }

  static fromSpecs(specs: Composite) {
    return this.create(specs, getGeometry(specs))
  }

  static fromName(name: string) {
    const specs = Composite.query.withName(name)
    return this.fromSpecs(specs)
  }

  // TODO this doesn't work for diminished solids
  protected capInnerVertIndices = once(() => {
    return new Set(
      this.augmentedCaps().flatMap((cap) =>
        cap.innerVertices().map((v) => v.index),
      ),
    )
  })

  protected sourceVertices() {
    return this.geom.vertices.filter(
      (v) => !this.capInnerVertIndices().has(v.index),
    )
  }

  abstract caps(): Cap[]

  augmentedCaps() {
    return this.caps()
  }

  gyrateCaps(): Cap[] {
    return []
  }

  // TODO implement this for diminished/gyrate
  sourceCentroid() {
    return getCentroid(this.sourceVertices().map((v) => v.vec))
  }

  /** Returns whether the given face is part of the source polyhedron (as opposed to a cap) */
  isSourceFace(face: Face) {
    return face.vertices.every((v) => !this.capInnerVertIndices().has(v.index))
  }

  /** Return whether this solid can be modified in a way that creates separate alignments */
  hasAlignment() {
    return this.specs.isMono()
  }

  modifications(): Base[] {
    return [
      ...this.augmentedCaps(),
      ...this.diminishedFaces(),
      ...this.gyrateCaps(),
    ]
  }

  alignment(cap: Base) {
    if (!this.hasAlignment()) return undefined
    return cap.isInverse(getSingle(this.modifications())) ? "para" : "meta"
  }

  abstract canAugment(face: Face): boolean

  isCapTop(face: Face) {
    return face.vertices.every((v) => this.capInnerVertIndices().has(v.index))
  }

  capTops() {
    return this.geom.faces.filter((f) => this.isCapTop(f))
  }

  isDiminished(face: Face) {
    return false
  }

  diminishedFaces() {
    return this.geom.faces.filter((f) => this.isDiminished(f))
  }

  isGyrate(cap: Cap) {
    return false
  }

  isGyrateFace(face: Face) {
    return false
  }

  normalize(): this {
    const newGeom = this.geom.withFaces(
      this.geom.faces.map((f) => {
        if (this.isCapTop(f)) return f
        const cap = this.augmentedCaps().find((cap) => f.inSet(cap.faces()))
        if (!cap) return f
        const pivotVertex = find(f.vertices, (v) =>
          v.inSet(cap.innerVertices()),
        )
        return pivot(f.vertices, pivotVertex)
      }),
    )
    return CompositeForme.create(this.specs, newGeom) as any
  }

  faceAppearance(face: Face): FaceType {
    const source = this.specs.sourceClassical()
    const polygonType = this.specs.sourceClassical().isTruncated()
      ? "secondary"
      : "primary"

    if (this.isSourceFace(face)) {
      const facet = this.getFacet(face)
      const polygonType = face.numSides > 5 ? "secondary" : "primary"
      if (facet) {
        return ClassicalFace.facet(source.data.family, polygonType, facet)
      } else {
        return ClassicalFace.edge(source.data.family, "prism")
      }
    } else if (this.isDiminished(face)) {
      return ClassicalFace.facet(source.data.family, polygonType, "face")
    } else if (this.isCapTop(face)) {
      return CapstoneFace.capTop(source.data.family)
    } else {
      // augmented cap face
      const cap = find(this.augmentedCaps(), (cap) => face.inSet(cap.faces()))
      const sideColors = face.vertices.map((v) =>
        v.inSet(cap.innerVertices()) ? "top" : "base",
      )
      return CapstoneFace.capSide(source.data.family, sideColors)
    }
  }
}

export class AugmentedPrismForme extends CompositeForme {
  // @override
  orientation() {
    const caps = this.caps()
    const normal =
      this.specs.data.augmented === 2
        ? getCentroid(caps.map((c) => c.normal()))
        : caps[0].normal()
    return [this.endFaces()[0], normal] as const
  }

  caps = once(() => {
    return this.geom.caps({ type: "primary", base: 4 })
  })

  hasAlignment() {
    return super.hasAlignment() && this.specs.sourcePrism().isSecondary()
  }

  endFaces = once(() => {
    const source = this.specs.sourcePrism()
    if (source.isPrimary() && source.isTriangular()) {
      for (const face1 of this.geom.faces) {
        for (const face2 of this.geom.faces) {
          if (face1.isInverse(face2)) {
            return [face1, face2] as const
          }
        }
      }
      throw new Error(`Could not find base faces for ${this.specs.name()}`)
    }

    if (source.isSquare()) {
      for (const f1 of this.geom.facesWithNumSides(4)) {
        for (const f2 of this.geom.facesWithNumSides(4)) {
          if (f1.isInverse(f2)) {
            return [f1, f2] as const
          }
        }
      }
      throw new Error(`Error finding inverse faces`)
    }

    return this.geom.facesWithNumSides(
      this.specs.sourcePrism().baseSides(),
    ) as [Face, Face]
  })

  isEndFace(face: Face) {
    return face.inSet(this.endFaces())
  }

  isSideFace(face: Face) {
    // FIXME deal with square prism
    return face.numSides === 4
  }

  canAugment(face: Face) {
    if (!this.isSideFace(face)) return false
    if (this.specs.sourcePrism().baseSides() === 3) return true
    return this.caps().every((cap) =>
      cap
        .boundary()
        .adjacentFaces()
        .every((f) => !f.equals(face)),
    )
  }

  faceAppearance(face: Face) {
    const source = this.specs.sourcePrism()
    if (this.isEndFace(face)) {
      return CapstoneFace.prismBase(source.data.base, source.data.type)
    } else if (this.isSideFace(face)) {
      return CapstoneFace.side(source.data.base, "prism")
    } else {
      const cap = find(this.caps(), (cap) => face.inSet(cap.faces()))
      const sideColors = face.vertices.map((v) => {
        return v.inSet(cap.innerVertices()) ? "top" : "base"
      })
      return CapstoneFace.capSide(4, sideColors)
    }
  }
}

export class AugmentedClassicalForme extends CompositeForme {
  // @override
  orientation() {
    const caps = this.caps()
    if (this.specs.isTri()) {
      const axis = getCentroid(caps.map((c) => c.normal()))
      return [axis, caps[0]] as const
    }
    if (this.specs.hasAlignment() && this.specs.isMeta()) {
      const axis = getCentroid(caps.map((c) => c.normal()))
      const cross = axis.clone().cross(caps[0].normal())
      return [axis, cross] as const
    }
    const cap = caps[0]
    const edge = find(cap.boundary().edges, (e) => e.face.numSides === 3)
    return [cap, edge] as const
  }

  hasAlignment() {
    return super.hasAlignment() && this.specs.sourceClassical().isIcosahedral()
  }

  caps = once(() => {
    const specs = this.specs.sourceClassical()
    const caps = this.geom.caps({
      type: specs.isTruncated() ? "secondary" : "primary",
      base: specs.data.family,
    })
    // If it's an augmented tetrahedron, only consider the first cap
    if (specs.isTetrahedral() && specs.isRegular()) {
      return this.specs.isAugmented() ? [caps[0]] : []
    }
    return caps
  })

  getFacet(face: Face) {
    if (!this.isSourceFace(face)) return null
    if (this.specs.sourceClassical().isRegular() || face.numSides !== 3) {
      return "face"
    } else {
      return "vertex"
    }
  }

  canAugment(face: Face) {
    if (!this.isFacetFace(face, "face")) return false
    return this.caps().every((cap) =>
      cap
        .boundary()
        .adjacentFaces()
        .every((f) => !f.equals(face)),
    )
  }
}

export class DiminishedSolidForme extends CompositeForme {
  caps = once(() => {
    return this.geom
      .caps({ type: "primary", base: this.specs.sourceClassical().data.family })
      .concat(this.augmentedCaps())
  })

  augmentedCaps = once(() => {
    return this.specs.sourceClassical().isIcosahedral()
      ? this.geom.caps({ type: "primary", base: 3 })
      : []
  })

  // @override
  getFacet(face: Face) {
    return this.isSourceFace(face) ? "vertex" : null
  }

  // @override
  orientation() {
    const faces = this.diminishedFaces()
    if (this.specs.isAugmented() || this.specs.isTri()) {
      const normal = getCentroid(faces.map((f) => f.normal()))
      return [normal, faces[0]] as const
    }
    if (this.specs.hasAlignment() && this.specs.isMeta()) {
      const axis = getCentroid(faces.map((f) => f.normal()))
      const cross = axis.clone().cross(faces[0].normal())
      return [axis, cross] as const
    }
    return [faces[0], faces[0].edges[0]] as const
  }

  isSourceFace(face: Face) {
    return face.numSides === 3 && super.isSourceFace(face)
  }

  // TODO dedupe with gyrate
  isDiminished(face: Face) {
    return (
      this.specs.isDiminished() &&
      face.numSides === this.geom.largestFace().numSides
    )
  }

  isAugmentedFace(face: Face) {
    if (!this.specs.isAugmented()) return false
    return face.inSet(this.augmentedCaps()[0].faces())
  }

  canAugment(face: Face) {
    if (this.specs.isAugmented()) return false
    return (
      this.isDiminished(face) ||
      face.adjacentFaces().every((f) => f.numSides === 5)
    )
  }
}

export class GyrateSolidForme extends CompositeForme {
  private geomCaps = once(() => {
    return this.geom.caps({
      type: "secondary",
      base: this.specs.sourceClassical().data.family,
    })
  })

  private tetrahedralCaps() {
    if (this.specs.isDiminished()) {
      // Discount the diminished caps
      return []
    } else if (this.specs.isGyrate()) {
      // Only count the first returned cap and consider it the gyrate cap
      return [this.geomCaps()[0]]
    } else {
      // delegate to classical method if normal
      return ClassicalForme.create(
        this.specs.sourceClassical(),
        this.geom,
      ).caps()
    }
  }

  private octahedralCaps() {
    const allCaps = this.geomCaps()
    if (this.specs.data.gyrate === 2) {
      // If bigyrate, count opposite caps as gyrate caps
      // which will be two out of many caps
      const [cap, ...rest] = allCaps
      return [cap, find(rest, (c) => cap.isInverse(c))]
    } else {
      // In all other cases, there is no ambiguity
      return allCaps
    }
  }

  hasAlignment() {
    return this.specs.sourceClassical().isIcosahedral() && super.hasAlignment()
  }

  caps = once(() => {
    switch (this.specs.sourceClassical().data.family) {
      case 3:
        return this.tetrahedralCaps()
      case 4:
        return this.octahedralCaps()
      case 5:
        // no need to filter for icosahedral
        return this.geomCaps()
    }
  })

  augmentedCaps = () => []

  // @override
  orientation() {
    const mods = this.modifications()
    if (mods.length === 0) {
      // TODO return orientation of the base
      return [this.geom.faces[0], this.geom.faces[1]] as const
    }
    // FIXME make this more sophisticated
    const boundary = mods[0] instanceof Cap ? mods[0].boundary() : mods[0]
    return [mods[0], boundary.edges[0]] as const
  }

  /** Return whether the given cap is gyrated */
  isGyrate(cap: Cap) {
    const source = this.specs.sourceClassical()
    if (source.isTetrahedral()) {
      return this.specs.isGyrate()
    }
    if (source.isOctahedral()) {
      switch (this.specs.data.gyrate) {
        case 0:
          return false
        case 1:
          return cap === this.caps()[0]
        case 2:
          return true
      }
    }
    return cap.boundary().edges.every((edge) => {
      const [n1, n2] = edge.adjacentFaces().map((f) => f.numSides)
      return (n1 === 4) === (n2 === 4)
    })
  }

  gyrateCaps() {
    return this.caps().filter((cap) => this.isGyrate(cap))
  }

  gyrateFaces = once(() => {
    return this.gyrateCaps().flatMap((cap) => cap.faces())
  })

  isSourceFace(face: Face) {
    return face.numSides <= 5 && super.isSourceFace(face)
  }

  isGyrateFace(face: Face) {
    return face.inSet(this.gyrateFaces())
  }

  isDiminished(face: Face) {
    return (
      this.specs.isDiminished() &&
      face.numSides === this.geom.largestFace().numSides
    )
  }

  getFacetTetrahedral(face: Face) {
    if (face.numSides !== 3) return null
    // TODO handle case of unmodified forme
    if (this.isGyrateFace(face)) {
      // for a gyrated face, the "top" face of the cap is face-facet
      return face.adjacentFaces().every((f) => f.numSides === 4)
        ? "face"
        : "vertex"
    } else {
      return face.adjacentFaces().every((f) => f.numSides === 4)
        ? "vertex"
        : "face"
    }
  }

  // @override
  getFacet(face: Face) {
    switch (this.specs.sourceClassical().data.family) {
      case 3:
        return this.getFacetTetrahedral(face)
      default: {
        // FIXME!! needs to handle non-icosahedral cases
        const { family } = this.specs.sourceClassical().data
        if (face.numSides === family) return "face"
        if (face.numSides === 3) return "vertex"
        return null
      }
    }
  }

  canAugment(face: Face) {
    return this.isDiminished(face)
  }

  faceAppearance(face: Face) {
    const source = this.specs.sourceClassical()
    if (this.isGyrateFace(face)) {
      const facet = this.getFacet(face)
      if (facet) {
        return ClassicalFace.facet(source.data.family, "primary", facet, true)
      } else {
        return ClassicalFace.edge(source.data.family, "prism", true)
      }
    } else {
      return super.faceAppearance(face)
    }
  }
}
