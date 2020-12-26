import { countBy } from "lodash-es"

import { getCyclic, flatMapUniq } from "utils"
import { VIndex, FIndex } from "./solidTypes"
import type Polyhedron from "./Polyhedron"
import FaceLike from "./FaceLike"
import Edge from "./Edge"

export default class Face extends FaceLike {
  index: FIndex
  value: VIndex[]

  constructor(polyhedron: Polyhedron, index: FIndex) {
    const value = polyhedron._solidData.faces[index]
    const vertices = value.map((vIndex) => polyhedron.vertices[vIndex])
    const edges = vertices.map(
      (v, i) => new Edge(v, getCyclic(vertices, i + 1)),
    )

    super(vertices, edges)
    this.index = index
    this.value = value
  }

  // Return true if this face is the same as the given face (within a polyhedron)
  equals(other: Face) {
    return this.index === other.index
  }

  inSet(faces: readonly Face[]) {
    return faces.some((face) => this.equals(face))
  }

  /** Return the set of faces that share a vertex to this face (including itself) */
  vertexAdjacentFaces() {
    return flatMapUniq(
      this.vertices,
      (vertex) => vertex.adjacentFaces(),
      "index",
    )
  }

  /** Return adjacent faces counted by number of sides */
  adjacentFaceCounts() {
    return countBy(this.adjacentFaces(), "numSides")
  }
}
