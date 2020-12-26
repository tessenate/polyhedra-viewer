import { Polyhedron } from "math/polyhedra"
import { mapObject } from "utils"
import { PolyhedronSpecs, Capstone, Composite } from "specs"
import { CapOptions, capOptionArgs } from "./cutPasteUtils"
import { getTransformedVertices } from "../operationUtils"
import { makeOperation } from "../Operation"
import { PolyhedronForme as Forme } from "math/formes"
import {
  GraphGenerator,
  toDirected,
  combineOps,
  OpInput,
} from "../operationPairs"

const TAU = 2 * Math.PI

function applyGyrate(polyhedron: Polyhedron, { cap }: CapOptions) {
  // get adjacent faces
  const boundary = cap.boundary()
  // rotate the cupola/rotunda top
  const theta = TAU / boundary.numSides
  const oldToNew = mapObject(boundary.vertices, (vertex, i) => [
    vertex.index,
    i,
  ])

  const mockPolyhedron = polyhedron.withChanges((solid) =>
    solid.addVertices(boundary.vertices).mapFaces((face) => {
      if (face.inSet(cap.faces())) {
        return face
      }
      return face.vertices.map((v) => {
        return v.inSet(boundary.vertices)
          ? polyhedron.numVertices() + oldToNew[v.index]
          : v.index
      })
    }),
  )

  const endVertices = getTransformedVertices(
    [cap],
    (cap) => cap.withCentroidOrigin(cap.rotateNormal(theta)),
    mockPolyhedron.vertices,
  )

  // TODO the animation makes the cupola shrink and expand.
  // Make it not do that.
  return {
    animationData: {
      start: mockPolyhedron,
      endVertices,
    },
  }
}

export interface GraphOpts {
  align?: "meta" | "para"
  direction?: "forward" | "back"
}

type GyrateGraphGenerator<S> = GraphGenerator<S, GraphOpts, GraphOpts>

interface GyrateArgs<S extends PolyhedronSpecs> {
  graph(): GyrateGraphGenerator<S>
  toGraphOpts(forme: Forme<S>, options: CapOptions): GraphOpts
}

function makeGyrateOp<S extends PolyhedronSpecs>({
  graph,
  toGraphOpts,
}: GyrateArgs<S>): GyrateOpArgs<S> {
  return {
    graph: function* () {
      yield* toDirected("left", graph)()
      yield* toDirected("right", graph)()
    },
    toGraphOpts,
    apply({ geom }, options) {
      return applyGyrate(geom, options)
    },
  }
}

type GyrateOpArgs<S extends PolyhedronSpecs> = OpInput<CapOptions, S, GraphOpts>

const gyrateCapstone = makeGyrateOp<Capstone>({
  graph: function* () {
    for (const cap of Capstone.query.where(
      (s) => (s.hasGyrate() && s.isOrtho() && !s.isDigonal()) || s.isChiral(),
    )) {
      yield { left: cap, right: cap.gyrate() }
    }
  },
  toGraphOpts() {
    return {}
  },
})

const gyrateComposite = makeGyrateOp<Composite>({
  graph: function* () {
    for (const solid of Composite.query.where(
      (s) => s.isGyrateSolid() && s.isGyrate(),
    )) {
      yield {
        left: solid.ungyrate(),
        right: solid,
        options: {
          left: { direction: "forward", align: solid.data.align },
          right: { direction: "back" },
        },
      }
    }
  },
  toGraphOpts(forme, { cap }) {
    if (forme.isGyrate(cap)) {
      return { direction: "back" }
    } else {
      return { direction: "forward", align: forme.alignment(cap) }
    }
  },
})

export const gyrate = makeOperation("gyrate", {
  ...combineOps<Capstone | Composite, CapOptions, GraphOpts>([
    gyrateCapstone,
    gyrateComposite,
  ]),
  ...capOptionArgs,
})
