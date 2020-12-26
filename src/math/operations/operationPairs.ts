import { isMatch, pickBy } from "lodash-es"
import { PolyhedronSpecs } from "specs"
import { VertexArg } from "math/polyhedra"
import {
  OpArgs,
  SolidArgs,
  GraphEntry as DirectedGraphEntry,
} from "./Operation"
import { Pose, alignPolyhedron, getGeometry } from "./operationUtils"
import BaseForme from "math/formes/BaseForme"
import { PolyhedronForme as Forme, createForme } from "math/formes"

export type Side = "left" | "right"

function oppositeSide(side: Side) {
  return side === "left" ? "right" : "left"
}

export interface GraphOpts<L, R> {
  left: L
  right: R
}

// TODO ugh this is still ugly
export interface GraphEntry<Specs, L, R> {
  left: Specs
  right: Specs
  options?: GraphOpts<L, R>
}

export function toDirected<S extends Side, Specs, L, R>(
  side: S,
  graph: () => Generator<GraphEntry<Specs, L, R>>,
): () => Generator<DirectedGraphEntry<Specs, Opts<S, L, R>>> {
  return function* () {
    for (const entry of graph()) {
      yield {
        start: entry[side],
        end: entry[oppositeSide(side)],
        options: entry.options?.[side] as any,
      }
    }
  }
}

export type GraphGenerator<Specs, L, R> = Generator<GraphEntry<Specs, L, R>>

type MiddleGetter<S extends PolyhedronSpecs, L, R> = (
  entry: GraphEntry<S, L, R>,
) => S | Forme<S>

export interface OpPairInput<Specs extends PolyhedronSpecs, L = {}, R = L> {
  // The graph of what polyhedron spec inputs are allowed and what maps to each other
  graph(): GraphGenerator<Specs, L, R>
  // Get the intermediate polyhedron for the given graph entry
  middle: Side | MiddleGetter<Specs, L, R>
  // Get the pose of a left, right, or intermediate forme
  getPose(solid: Forme<Specs>, opts: GraphOpts<L, R>): Pose
  // Move the intermediate figure to the left position
  toLeft?(
    solid: Forme<Specs>,
    opts: GraphOpts<L, R>,
    result: Specs,
  ): VertexArg[]
  // Move the intermediate figure to the right position
  toRight?(
    solid: Forme<Specs>,
    opts: GraphOpts<L, R>,
    result: Specs,
  ): VertexArg[]
}

function defaultGetter<Specs extends PolyhedronSpecs>({
  geom,
}: SolidArgs<Specs>) {
  return geom.vertices
}

type Opts<S extends Side, L, R> = S extends "left" ? L : R

class OpPair<
  Specs extends PolyhedronSpecs,
  L extends {} = {},
  R extends {} = L
> {
  inputs: OpPairInput<Specs, L, R>
  graph: GraphEntry<Specs, L, R>[]

  constructor(inputs: OpPairInput<Specs, L, R>) {
    this.inputs = inputs
    this.graph = [...this.inputs.graph()]
  }

  private getEntries(side: Side, specs: Specs) {
    return this.graph.filter((entry) => entry[side].equals(specs))
  }

  findEntry<S extends Side>(side: S, specs: Specs, opts?: Opts<S, L, R>) {
    return this.graph.find(
      (entry) =>
        entry[side].equals(specs) &&
        isMatch(entry.options?.[side] ?? {}, opts ?? {}),
    )
  }

  getEntry<S extends Side>(side: S, specs: Specs, opts?: Opts<S, L, R>) {
    const entry = this.findEntry(side, specs, opts)
    if (!entry)
      throw new Error(
        `Could not find ${side} entry with specs: ${specs.name()}, opts: ${JSON.stringify(
          opts,
        )}`,
      )
    return entry
  }

  hasOptions(side: Side, specs: Specs) {
    return this.getEntries(side, specs).length > 1
  }

  *allOptions<S extends Side>(side: S, specs: Specs): Generator<Opts<S, L, R>> {
    for (const entry of this.getEntries(side, specs)) {
      yield (entry.options?.[side] ?? {}) as Opts<S, L, R>
    }
  }

  canApplyTo(side: Side, specs: PolyhedronSpecs) {
    return !!this.findEntry(side, specs as Specs)
  }

  getOpposite<S extends Side>(side: S, specs: Specs, options?: Opts<S, L, R>) {
    return this.getEntry(side, specs, options)[oppositeSide(side)]
  }

  apply<S extends Side>(side: S, solid: Forme<Specs>, opts: Opts<S, L, R>) {
    const {
      middle: getMiddle,
      getPose,
      toLeft = defaultGetter,
      toRight = defaultGetter,
    } = this.inputs
    const specs = solid.specs as Specs
    const entry = this.getEntry(side, specs, opts)
    const options =
      entry.options ?? ({ left: {}, right: {} } as GraphOpts<L, R>)
    const solidForme = createForme(specs, solid.geom)
    const startPose = getPose(solidForme, options)

    const endSide = oppositeSide(side)
    const endSpecs = entry[endSide]
    const endGeom = getGeometry(endSpecs)
    const alignedEnd = alignPolyhedron(
      endGeom,
      getPose(createForme(endSpecs, endGeom), options),
      startPose,
    )

    let middle: Forme<Specs>
    if (typeof getMiddle === "string") {
      // If we receive a Side argument, set the middle to whichever end polyhedron
      // matches the side
      middle =
        getMiddle === side ? solidForme : createForme(endSpecs, alignedEnd)
    } else {
      // Otherwise, we have to fetch the intermediate solid ourselves
      const inter = getMiddle(entry)
      // TODO figure out a way to get this without importing the base constructor?
      const middleSolid =
        inter instanceof BaseForme
          ? inter
          : createForme(inter, getGeometry(inter))

      const alignedInter = alignPolyhedron(
        middleSolid.geom,
        getPose(middleSolid, options),
        startPose,
      )
      middle = createForme(middleSolid.specs as Specs, alignedInter)
    }

    const [startFn, endFn] =
      side === "left" ? [toLeft, toRight] : [toRight, toLeft]

    return {
      animationData: {
        start: middle.geom.withVertices(startFn(middle, options, specs)),
        endVertices: endFn(middle, options, endSpecs),
      },
      result: alignedEnd,
    }
  }
}

export type OpInput<O, S extends PolyhedronSpecs, GO = O> = Required<
  Pick<OpArgs<O, S, GO>, "apply" | "graph" | "toGraphOpts">
>

/**
 * Turn an operation pair into the one-way operation corresponding to the given side
 */
function makeOperation<S extends Side, Specs extends PolyhedronSpecs, L, R>(
  side: S,
  op: OpPair<Specs, L, R>,
): OpInput<Opts<S, L, R>, Specs> {
  return {
    apply(solid, opts) {
      return op.apply(side, solid, opts)
    },
    graph: toDirected(side, op.inputs.graph),
    toGraphOpts(forme, opts) {
      return opts
    },
  }
}

/**
 * Takes the given input and creates a pair of inverse operations.
 */
export function makeOpPair<Specs extends PolyhedronSpecs, L = {}, R = L>(
  opInput: OpPairInput<Specs, L, R>,
) {
  const op = new OpPair(opInput)
  return { left: makeOperation("left", op), right: makeOperation("right", op) }
}

export function combineOps<S extends PolyhedronSpecs, O, GO extends {} = O>(
  opArgs: OpInput<O, S, GO>[],
): OpInput<O, S, GO> {
  interface CallbackArg {
    op: OpInput<O, S, GO>
    forme: Forme<S>
    graphOpts: GO
  }

  function doWithRightForme<R>(
    solid: Forme<S>,
    opts: O,
    callback: (args: CallbackArg) => R,
  ) {
    for (const op of opArgs) {
      // Finagle with the arguments to get the correctly (un)wrapped
      // version of the forme
      for (const { start, options = {} } of op.graph()) {
        if (!start.equivalent(solid.specs)) {
          continue
        }
        const forme = createForme(start, solid.geom)
        const graphOpts = op.toGraphOpts(forme, opts)
        if (isMatch(options, pickBy(graphOpts))) {
          return callback({ op, forme, graphOpts })
        }
      }
    }
    throw new Error(
      `Could not find matching graph entry for ${
        solid.specs.type
      } ${solid.specs.name()}`,
    )
  }
  return {
    graph: function* () {
      for (const op of opArgs) {
        yield* op.graph()
      }
    },
    apply(solid, opts) {
      return doWithRightForme(solid, opts, ({ op, forme }) =>
        op.apply(forme, opts),
      )
    },
    toGraphOpts(solid, opts) {
      return doWithRightForme(solid, opts, ({ graphOpts }) => graphOpts)
    },
  }
}
