import { once } from "lodash-es"

import { flatMapUniq, find } from "utils"
import { CapType, PolygonType, PrimaryPolygon } from "specs"
import Facet from "./Facet"
import type Polyhedron from "./Polyhedron"
import type Face from "./Face"
import type Vertex from "./Vertex"
import type Edge from "./Edge"
import FaceLike from "./FaceLike"

// Find the boundary of a connected set of faces
function getBoundary(faces: Face[]) {
  const e0 = find(
    faces.flatMap((f) => f.edges),
    (e) => !e.twin().face.inSet(faces),
  )!

  const result: Edge[] = []
  let e = e0
  let count = 0
  do {
    if (count++ > 20) throw new Error("we done goofed")
    if (!e.twin().face.inSet(faces)) {
      result.push(e)
      const nextTwin = e.next().twin()
      if (nextTwin.face.inSet(faces)) {
        e = nextTwin.next()
      } else {
        e = e.next()
      }
    } else {
      e = e.twin().next()
    }
  } while (!e.equals(e0))
  return new FaceLike(
    result.map((e) => e.v1),
    result,
  )
}

type CapBase = 2 | PrimaryPolygon

interface Constructor<T> {
  new (facet: T, base: CapBase): Cap
}
function createMapper<T>(
  mapper: (p: Polyhedron, base: CapBase) => T[],
  Base: Constructor<T>,
) {
  return function* (polyhedron: Polyhedron, opts: CapSearchOpts) {
    for (const value of mapper(polyhedron, opts.base)) {
      yield new Base(value, opts.base)
    }
  }
}

export interface CapSearchOpts {
  base: CapBase
  type: PolygonType
  rotunda?: boolean
  fastigium?: boolean
}

export default abstract class Cap extends Facet {
  type: CapType
  private _innerVertices: Vertex[]

  static *getAll(polyhedron: Polyhedron, opts: CapSearchOpts) {
    if (opts.type === "primary") {
      yield* Pyramid.getAll(polyhedron, opts)
    } else if (opts.fastigium) {
      yield* Fastigium.getAll(polyhedron, opts)
    } else {
      yield* Cupola.getAll(polyhedron, opts)
      if (opts.rotunda) {
        yield* Rotunda.getAll(polyhedron, opts)
      }
    }
  }

  constructor(innerVertices: Vertex[], type: CapType) {
    super(innerVertices[0].polyhedron)
    this._innerVertices = innerVertices
    this.type = type
  }

  innerVertices() {
    return this._innerVertices
  }

  get vertices() {
    return this.allVertices()
  }

  private allVertices = once(() => {
    return this.innerVertices().concat(this.boundary().vertices)
  })

  topFace(): Face {
    throw new Error(`Cap type ${this.type} does not have a top face`)
  }

  faces = once(() => {
    return flatMapUniq(this.innerVertices(), (v) => v.adjacentFaces(), "index")
  })

  boundary = once(() => {
    return getBoundary(this.faces())
  })

  // NOTE for convenience, this calculates the centroid of the *boundary* not of all the vertices
  centroid = () => this.boundary().centroid()

  normal = () => this.boundary().normal()

  adjacentFaces = () => this.boundary().adjacentFaces()
}

class Pyramid extends Cap {
  constructor(vertex: Vertex, base: CapBase) {
    super([vertex], "pyramid")
  }
  static getAll = createMapper(
    (p, base) =>
      p.vertices.filter((v) => {
        const faces = v.adjacentFaces()
        return faces.length === base && faces.every((f) => f.numSides === 3)
      }),
    Pyramid,
  )
}

class Fastigium extends Cap {
  constructor(edge: Edge, base: CapBase) {
    super(edge.vertices, "cupola")
  }
  static getAll = createMapper(
    (p, base) =>
      p.edges.filter((e) => e.adjacentFaces().every((f) => f.numSides === 4)),
    Fastigium,
  )
}

class Cupola extends Cap {
  private _topFace: Face
  constructor(face: Face, base: CapBase) {
    super(face.vertices, "cupola")
    this._topFace = face
  }

  topFace() {
    return this._topFace
  }

  static getAll = createMapper(
    (p, base) =>
      p
        .facesWithNumSides(base)
        .filter((f) => f.adjacentFaces().every((f2) => f2.numSides === 4)),
    Cupola,
  )
}

class Rotunda extends Cap {
  private _topFace: Face
  constructor(face: Face, base: CapBase) {
    super(
      flatMapUniq(face.vertices, (v) => v.adjacentVertices(), "index"),
      "rotunda",
    )
    this._topFace = face
  }

  topFace() {
    return this._topFace
  }

  static getAll = createMapper(
    (p) =>
      p.facesWithNumSides(5).filter((face) => {
        return face
          .adjacentFaces()
          .every(
            (f3) =>
              f3.numSides === 3 &&
              f3.adjacentFaces().every((f5) => f5.numSides === 5),
          )
      }),
    Rotunda,
  )
}
