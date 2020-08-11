import { once } from "lodash"
import BaseForme from "./BaseForme"
import { Capstone, FacetType } from "specs"
import { Polyhedron, Face, Edge, Cap, FaceLike, Facet } from "math/polyhedra"
import { getCentroid } from "math/geom"
import { getGeometry } from "math/operations/operationUtils"

type CapstoneEnd = Facet

// TODO add more useful functions here
export default abstract class CapstoneForme extends BaseForme<Capstone> {
  static create(specs: Capstone, geom: Polyhedron) {
    switch (specs.data.count) {
      case 0:
        return specs.isSnub()
          ? new SnubCapstoneForme(specs, geom)
          : new PrismaticForme(specs, geom)
      case 1:
        return new MonoCapstoneForme(specs, geom)
      case 2:
        return new BiCapstoneForme(specs, geom)
    }
  }

  static fromSpecs(specs: Capstone) {
    return this.create(specs, getGeometry(specs))
  }

  static fromName(name: string) {
    return this.fromSpecs(Capstone.query.withName(name))
  }

  orientation() {
    if (this.specs.isSnub()) {
      const top = this.ends()[0]
      return [top, top.vertices[0]] as const
    }
    const top = this.endBoundaries()[0]
    return [top, top.edges[0]] as const
  }

  protected abstract queryTops(): Generator<CapstoneEnd>
  protected *queryBottoms(): Generator<CapstoneEnd> {
    yield* this.queryTops()
  }

  ends = once(() => {
    for (const top of this.queryTops()) {
      for (const bottom of this.queryBottoms()) {
        if (top.isInverse(bottom)) {
          return [top, bottom]
        }
      }
    }
    throw new Error(
      `Error finding two opposite ends for capstone ${this.specs.name()}`,
    )
  })

  private capOpts() {
    return {
      base: this.specs.data.base,
      type: this.specs.data.type,
      fastigium: this.specs.isDigonal(),
      rotunda: this.specs.isPentagonal(),
    }
  }

  protected caps = once(() => {
    return this.geom.caps(this.capOpts())
  })

  endCaps() {
    return this.ends().filter((end) => end instanceof Cap) as Cap[]
  }

  isEndCap(cap: Cap) {
    return this.endCaps().some((c) => c.isAligned(cap))
  }

  endFaces() {
    return this.ends().filter((end) => end instanceof Face) as Face[]
  }

  isEndFace(face: Face) {
    return face.inSet(this.endFaces())
  }

  /**
   * Return the `FaceLike` representation of this capstone's ends:
   * either the face itself or the boundary of the cap.
   */
  endBoundaries(): [FaceLike, FaceLike] {
    return this.ends().map((end) =>
      end instanceof Cap ? end.boundary() : end,
    ) as [FaceLike, FaceLike]
  }

  prismaticHeight() {
    const [top, bot] = this.ends()
    return top.centroid().distanceTo(bot.centroid())
  }

  /**
   * Returns the end of the capstone that this face belongs to,
   * or undefined if the face does not belong to an end.
   */
  containingEnd(face: Face) {
    return this.ends().find((end) => {
      if (end instanceof Cap) {
        return face.inSet(end.faces())
      } else if (end instanceof Edge) {
        return false
      } else if (end instanceof Face) {
        return face.equals(end)
      }
      throw new Error("Unknown extremity")
    })
  }

  /**
   * Return whether the given face is in one of the ends of the cap.
   */
  isContainedInEnd(face: Face) {
    return !!this.containingEnd(face)
  }

  /**
   * Returns true if the face belongs to the top face of a capstone end.
   */
  isTop(face: Face) {
    const end = this.containingEnd(face)
    if (end instanceof Edge) return false
    if (end instanceof Face) return end.equals(face)
    if (end instanceof Cap) {
      if (end.type === "pyramid") return false
      return face.isAligned(end)
    }
    return false
  }

  isSideFace(face: Face) {
    return !this.isContainedInEnd(face)
  }

  centroid() {
    return getCentroid(this.ends().map((end) => end.centroid()))
  }

  // Utilities for determining "facet faces" analogous to thoes in classical formes
  // TODO these should only work with elongated orthobicupolae
  // TODO deduplicate these functions with ClassicalForme

  isFacetFace(face: Face, facet: FacetType) {
    if (facet === "face") {
      return (
        this.isTop(face) ||
        (this.isSideFace(face) &&
          face.adjacentFaces().every((f) => f.numSides === 4))
      )
    } else {
      return (
        this.isContainedInEnd(face) && face.numSides === 3 && !this.isTop(face)
      )
    }
  }

  facetFaces(facet: FacetType) {
    return this.geom.faces.filter((f) => this.isFacetFace(f, facet))
  }

  getFacet(face: Face) {
    if (this.isFacetFace(face, "face")) return "face"
    if (this.isFacetFace(face, "vertex")) return "vertex"
    return null
  }

  isAnyFacetFace(face: Face) {
    return this.isFacetFace(face, "face") || this.isFacetFace(face, "vertex")
  }

  faceAppearance(face: Face): any {
    const props = {
      type: "capstone",
      polygonType: this.specs.data.type,
      base: this.specs.data.base,
    }
    if (this.isSideFace(face)) {
      return {
        ...props,
        elongation: face.numSides === 3 ? "antiprism" : "prism",
      }
    }
    // otherwise it's a cap face
    if (this.isEndFace(face)) {
      return {
        ...props,
        capPosition: "prism",
      }
    }
    if (this.isTop(face)) {
      return {
        ...props,
        capPosition: "top",
      }
    }
    const cap = this.containingEnd(face) as Cap
    return {
      ...props,
      capPosition: "side",
      sideColors: face.vertices.map((v) =>
        v.inSet(cap.innerVertices()) ? "top" : "base",
      ),
    }
  }
}

class PrismaticForme extends CapstoneForme {
  *queryTops() {
    if (this.specs.isDigonal()) {
      yield* this.geom.edges
    } else {
      yield* this.geom.facesWithNumSides(this.specs.baseSides())
    }
  }
}

class SnubCapstoneForme extends CapstoneForme {
  *queryTops() {
    if (this.specs.isDigonal()) {
      yield* this.geom.edges.filter((e) =>
        e.vertices.every((v) => v.adjacentFaces().length === 4),
      )
    } else {
      yield* this.geom.facesWithNumSides(this.specs.baseSides())
    }
  }
}

class MonoCapstoneForme extends CapstoneForme {
  *queryTops() {
    yield* this.caps()
  }

  *queryBottoms() {
    yield* this.geom.facesWithNumSides(this.specs.baseSides())
  }
}

class BiCapstoneForme extends CapstoneForme {
  *queryTops() {
    const caps = this.caps()
    if (this.specs.isCupolaRotunda()) {
      yield* caps.filter((cap) => cap.type === "rotunda")
    } else {
      yield* caps
    }
  }

  *queryBottoms() {
    yield* this.caps()
  }
}
