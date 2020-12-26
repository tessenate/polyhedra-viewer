import { pullAt } from "lodash-es"

import { Vector3 } from "three"
import { VIndex, SolidData } from "./solidTypes"
import Vertex from "./Vertex"
import Face from "./Face"
import Polyhedron from "./Polyhedron"

export type VertexArg = Vector3 | Vertex

export type FaceArg = (VIndex | Vertex)[] | Face

export function normalizeVertex(v: VertexArg): Vector3 {
  return v instanceof Vertex ? v.vec : v
}

function normalizeFace(face: FaceArg): VIndex[] {
  if (Array.isArray(face)) {
    return face.map((v) => {
      if (typeof v === "number") return v
      return v.index
    })
  }
  return face.value
}

export default class Builder {
  polyhedron: Polyhedron
  solidData: SolidData

  constructor(polyhedron: Polyhedron) {
    this.polyhedron = polyhedron
    this.solidData = { ...polyhedron.solidData }
  }

  build() {
    return new Polyhedron(this.solidData)
  }

  // return a new polyhedron with the given vertices
  withVertices(vertices: VertexArg[]) {
    this.solidData.vertices = vertices.map(normalizeVertex)
    return this
  }

  // return a new polyhedron with the given faces
  withFaces(faces: FaceArg[]) {
    this.solidData.faces = faces.map(normalizeFace)
    // reset edges, since faces might have changed
    delete this.solidData.edges
    return this
  }

  addVertices(vertices: Vertex[] | VertexArg[]) {
    return this.withVertices(
      (this.solidData.vertices as VertexArg[]).concat(vertices),
    )
  }

  addFaces(faces: FaceArg[]) {
    return this.withFaces((this.solidData.faces as FaceArg[]).concat(faces))
  }

  mapVertices(iteratee: (v: Vertex) => VertexArg) {
    return this.withVertices(this.polyhedron.vertices.map(iteratee))
  }

  /** Map the faces of the *original* solid to new ones */
  mapFaces(iteratee: (f: Face) => FaceArg) {
    return this.withFaces(this.polyhedron.faces.map(iteratee))
  }

  withoutFaces(faces: Face[]) {
    const removed = [...this.solidData.faces]
    pullAt(
      removed,
      faces.map((f) => f.index),
    )
    return this.withFaces(removed)
  }

  addPolyhedron(other: Polyhedron) {
    return this.addVertices(other.vertices).addFaces(
      other.faces.map((face) =>
        face.vertices.map((v) => v.index + this.polyhedron.numVertices()),
      ),
    )
  }
}
