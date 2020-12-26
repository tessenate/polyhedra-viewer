import { Plane, Vector3 } from "three"

import { find } from "utils"
import { isPlanar, getNormal } from "math/geom"
import Facet from "./Facet"
import type Edge from "./Edge"
import type Vertex from "./Vertex"

const { PI, sin, tan } = Math

/**
 * An abstract polyhedral Face. An entity of a polyhedron that can be treated as a Face:
 * something containing vertices, edges and lying on a plane.
 * Examples include the boundary of a cupola and a concrete Face.
 */
export default class FaceLike extends Facet {
  // polyhedron: Polyhedron
  vertices: Vertex[]
  edges: Edge[]
  vectors: Vector3[]

  constructor(vertices: Vertex[], edges: Edge[]) {
    super(vertices[0].polyhedron)
    this.vertices = vertices
    this.edges = edges
    this.vectors = this.vertices.map((v) => v.vec)
  }

  get numSides() {
    return this.vertices.length
  }

  adjacentFaces() {
    return this.edges.map((edge) => edge.twin().face)
  }

  numUniqueSides() {
    return this.edges.filter((e) => e.isValid()).length
  }

  sideLength() {
    return this.edges[0].length()
  }

  isPlanar() {
    return isPlanar(this.vectors)
  }

  plane(): Plane {
    return new Plane().setFromNormalAndCoplanarPoint(
      this.normal(),
      this.centroid(),
    )
  }

  apothem() {
    return this.sideLength() / (2 * tan(PI / this.numSides))
  }

  radius() {
    return this.sideLength() / (2 * sin(PI / this.numSides))
  }

  /** Get the area of a *regular* polygon */
  area() {
    return (this.numSides * this.sideLength() * this.apothem()) / 2
  }

  /** Return the normal of the face given by the face index */
  normal() {
    const edge: Edge = find(this.edges, (e) => e.isValid())
    return getNormal([this.centroid(), edge.v1.vec, edge.v2.vec])
  }

  isValid() {
    return this.edges.every((e) => e.isValid())
  }
}
