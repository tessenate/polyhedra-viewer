import { Elementary } from "specs"
import BaseForme from "./BaseForme"
import { Polyhedron, Face } from "math/polyhedra"
import { find } from "utils"
import { isEqual } from "lodash-es"
import { ClassicalFace } from "./FaceType"

export default abstract class ElementaryForme extends BaseForme<Elementary> {
  static create(specs: Elementary, geom: Polyhedron) {
    switch (specs.name()) {
      case "sphenocorona":
        return new Sphenocorona(specs, geom)
      case "augmented sphenocorona":
        return new AugmentedSphenocorona(specs, geom)
      case "sphenomegacorona":
        return new Sphenomegacorona(specs, geom)
      case "hebesphenomegacorona":
        return new Hebesphenomegacorona(specs, geom)
      case "disphenocingulum":
        return new Disphenocingulum(specs, geom)
      case "bilunabirotunda":
        return new Bilunabirotunda(specs, geom)
      case "triangular hebesphenorotunda":
        return new TriangularHebesphenorotunda(specs, geom)
      default:
        throw new Error(`Undefined specs: ${specs.name()}`)
    }
  }

  // TODO decide on the right face colors for this
  faceAppearance(face: Face) {
    return ClassicalFace.facet(3, "primary", "face")
  }
}

class Sphenocorona extends ElementaryForme {
  orientation() {
    const edge = find(this.geom.edges, (e) =>
      e.adjacentFaces().every((f) => f.numSides === 4),
    )
    return [edge.normal().clone().negate(), edge.face] as const
  }
}

class AugmentedSphenocorona extends ElementaryForme {
  orientation() {
    const face = this.geom.faceWithNumSides(4)
    const cap = this.geom.caps({ type: "primary", base: 4 })[0]
    return [face.normal().clone().negate(), cap] as const
  }
}

class Sphenomegacorona extends ElementaryForme {
  orientation() {
    const edge = find(this.geom.edges, (e) =>
      e.adjacentFaces().every((f) => f.numSides === 4),
    )
    return [edge.normal().clone().negate(), edge.face] as const
  }
}

class Hebesphenomegacorona extends ElementaryForme {
  orientation() {
    const face = find(
      this.geom.facesWithNumSides(4),
      (face) =>
        face.adjacentFaces().filter((f) => f.numSides === 4).length === 2,
    )
    const face2 = find(face.adjacentFaces(), (f) => f.numSides === 4)
    return [face.normal().clone().negate(), face2] as const
  }
}

class Disphenocingulum extends ElementaryForme {
  orientation() {
    const edge = find(this.geom.edges, (e) =>
      e.adjacentFaces().every((f) => f.numSides === 4),
    )
    return [edge, edge.v1] as const
  }
}

class Bilunabirotunda extends ElementaryForme {
  orientation() {
    const vertex = find(this.geom.vertices, (v) =>
      isEqual(v.adjacentFaceCounts(), { 3: 2, 5: 2 }),
    )
    return [
      vertex,
      find(vertex.adjacentFaces(), (f) => f.numSides === 5),
    ] as const
  }
}

class TriangularHebesphenorotunda extends ElementaryForme {
  orientation() {
    const face = find(this.geom.facesWithNumSides(3), (f) =>
      f.adjacentFaces().every((f2) => f2.numSides === 5),
    )
    return [face, face.vertices[0]] as any
  }
}
