import { findKey, countBy } from "lodash-es"
import { Vector3 } from "three"
import { getCentroid } from "math/geom"
import { VIndex } from "./solidTypes"
import Facet from "./Facet"
import type Polyhedron from "./Polyhedron"
import { splitAt } from "utils"

function getCycles<T>(array: T[]) {
  return array.map((val, i) => {
    const [front, back] = splitAt(array, i)
    return [...back, ...front]
  })
}

function arrayMin<T>(a1: T[], a2: T[]): T[] {
  if (a1.length === 0) return a1
  if (a2.length === 0) return a2
  const [h1, ...t1] = a1
  const [h2, ...t2] = a2
  if (h1 < h2) return a1
  if (h2 < h1) return a2
  return [h1, ...arrayMin(t1, t2)]
}

export default class Vertex extends Facet {
  index: VIndex
  vec: Vector3

  constructor(polyhedron: Polyhedron, index: VIndex) {
    super(polyhedron)
    this.index = index
    this.vec = polyhedron._solidData.vertices[index]
  }

  vertices = [this]

  equals(other: Vertex) {
    return this.index === other.index
  }

  inSet(vertices: Vertex[]) {
    return vertices.some((vertex) => this.equals(vertex))
  }

  private *adjacentEdgesIter() {
    const v2 = parseInt(findKey(this.polyhedron.edgeToFaceGraph()[this.index])!)
    const e0 = this.polyhedron.edgeToFaceGraph()[this.index][v2].edge
    let e = e0
    let count = 0
    do {
      count++
      yield e
      e = e.prev().twin()
      if (count > 10) throw new Error("we done messed up")
    } while (!e.equals(e0))
  }

  adjacentEdges() {
    return [...this.adjacentEdgesIter()]
  }

  adjacentVertices() {
    return this.adjacentEdges().map((e) => e.v2)
  }

  adjacentFaces() {
    return this.adjacentEdges().map((e) => e.face)
  }

  configuration() {
    const config = this.adjacentFaces().map((f) => f.numSides)
    const allConfigs = getCycles(config).concat(
      getCycles([...config].reverse()),
    )
    return allConfigs.reduce(arrayMin)
  }

  /** Return adjacent faces counted by number of sides */
  adjacentFaceCounts() {
    return countBy(this.adjacentFaces(), "numSides")
  }

  normal() {
    return getCentroid(this.adjacentFaces().map((f) => f.normal())).normalize()
  }
}

export interface VertexList {
  readonly vertices: Vertex[]
  // TODO make this a more generic thing?
  readonly polyhedron: Polyhedron
}
