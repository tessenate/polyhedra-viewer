import { Vector3 } from "three"
import { pickBy, mapValues, isMatch, compact, uniq } from "lodash-es"

import { Polyhedron, Face, VertexArg, normalizeVertex } from "math/polyhedra"
import { deduplicateVertices } from "./operationUtils"
import { PolyhedronSpecs } from "specs"
import { PolyhedronForme as Forme, createForme, FaceType } from "math/formes"
import { find, EntryIters, cartesian } from "utils"

type SelectState = "selected" | "selectable" | undefined

export interface AnimationData {
  start: Polyhedron
  endVertices: Vector3[]
  startColors: (FaceType | undefined)[]
  endColors: (FaceType | undefined)[]
}

export interface OpResult {
  result: Forme
  animationData: AnimationData
}

interface PartialOpResult {
  result?: Polyhedron
  animationData: {
    start: Polyhedron
    endVertices: VertexArg[]
  }
}

export interface SolidArgs<Specs extends PolyhedronSpecs> {
  specs: Specs
  geom: Polyhedron
}

export interface GraphEntry<Specs, Opts> {
  start: Specs
  end: Specs
  options?: Opts
}

export interface OpArgs<
  Options extends {},
  Specs extends PolyhedronSpecs,
  GraphOpts = Options
> {
  graph(): Generator<GraphEntry<Specs, GraphOpts>>

  toGraphOpts(solid: Forme<Specs>, opts: Options): GraphOpts

  // Function to wrap a solid to create a forme of the correct type
  wrap?(solid: Forme<Specs>): Forme<Specs> | undefined

  hasOptions?(info: Specs): boolean

  apply(solid: Forme<Specs>, options: Options): PartialOpResult

  /** Return an iterator of all possible options of each polyhedron */
  allOptions?(solid: Forme<Specs>): EntryIters<Options>

  hitOption?: keyof Options

  getHitOption?(solid: Forme<Specs>, hitPnt: Vector3): Partial<Options>

  defaultOptions?(info: Specs): Partial<Options>

  selectionState?(
    face: Face,
    solid: Forme<Specs>,
    options: Partial<Options>,
  ): SelectState
}

type OperationArg = keyof OpArgs<any, any>
const methodDefaults = {
  getHitOption: {},
  defaultOptions: {},
}

// TODO get this to return the correct type
function fillDefaults<Options extends {}, Specs extends PolyhedronSpecs>(
  op: OpArgs<Options, Specs, any>,
): Required<OpArgs<Options, Specs>> {
  return {
    ...mapValues(
      methodDefaults,
      (fnDefault, fn: OperationArg) => op[fn] ?? (() => fnDefault),
    ),
    ...op,
  } as Required<OpArgs<Options, Specs>>
}

function getSourceAppearances(geom: Polyhedron, base: Forme) {
  return geom.faces.map((face, i) => {
    // Ignore invalid faces
    if (face.edges.filter((e) => e.isValid()).length < 3) return undefined
    // TODO alignment when augmenting/diminishing
    const aligned = base.geom.faces.find((f) => f.isAligned(face))
    if (!aligned) {
      return undefined
    }
    return base.faceAppearance(aligned)
  })
}

function arrayDefaults<T>(first: T[], second: T[]) {
  return first.map((item, i) => item ?? second[i])
}

function normalizeOpResult(
  opResult: PartialOpResult,
  newSpecs: PolyhedronSpecs,
  original: Forme,
): OpResult {
  const { result, animationData } = opResult
  const { start, endVertices } = animationData

  const end = start.withVertices(endVertices)
  const normedResult = result ?? deduplicateVertices(end)
  const resultForme = createForme(newSpecs, normedResult)

  // Populate the how the faces in the start and end vertices should be colored
  const startColors = getSourceAppearances(start, original)
  const endColors = getSourceAppearances(end, resultForme)

  return {
    result: resultForme,
    animationData: {
      start,
      endVertices: endVertices.map(normalizeVertex),
      startColors: arrayDefaults(startColors, endColors),
      endColors: arrayDefaults(endColors, startColors),
    },
  }
}

export default class Operation<Options extends {} = {}> {
  name: string
  graph: GraphEntry<PolyhedronSpecs, Options>[]
  hitOption: keyof Options
  private opArgs: Required<OpArgs<Options, PolyhedronSpecs>>

  constructor(name: string, opArgs: OpArgs<Options, PolyhedronSpecs, any>) {
    this.name = name
    this.opArgs = fillDefaults(opArgs)
    this.graph = [...this.opArgs.graph()]
    this.hitOption = this.opArgs.hitOption
  }

  apply(solid: Forme, options: Options) {
    // get the next polyhedron name
    const next = this.getResult(solid, options)

    // Get the actual operation result
    const opResult = this.opArgs.apply(this.wrap(solid), options ?? {})
    return normalizeOpResult(opResult, next, solid)
  }

  private wrap(solid: Forme) {
    return this.opArgs.wrap?.(solid) ?? solid
  }

  getHitOption(solid: Forme, hitPnt: Vector3) {
    return this.opArgs.getHitOption(this.wrap(solid), hitPnt)
  }

  canApplyTo(solid: Forme) {
    return this.graph.some((entry) =>
      entry.start.equals(this.wrap(solid).specs),
    )
  }

  getEntry(solid: Forme, opts: Options) {
    // FIXME optimize this and make error checking better
    // e.g. make it easier to type.
    return find(this.graph, ({ start, options }) => {
      return (
        start.equivalent(solid.specs) &&
        isMatch(
          options ?? {},
          pickBy(this.opArgs.toGraphOpts(this.wrap(solid), opts)),
        )
      )
    })
  }

  getEntries(solid: Forme) {
    return this.graph.filter((entry) => entry.start.equivalent(solid.specs))
  }

  /** Return all polyhedron formes that can be an input to this operation */
  allInputs() {
    return uniq(this.graph.map((entry) => entry.start.unwrap()))
  }

  getResult(solid: Forme, options: Options) {
    return this.getEntry(solid, options).end.unwrap()
  }

  hasOptions(solid: Forme) {
    if (this.opArgs.hasOptions) {
      return this.opArgs.hasOptions(this.wrap(solid).specs)
    }
    return this.getEntries(solid).length > 1
  }

  allOptions(solid: Forme, optionName: keyof Options) {
    if (!this.opArgs.allOptions)
      throw new Error(
        `Operation ${this.name} does not support getting individual options`,
      )
    return compact([...this.opArgs.allOptions(this.wrap(solid))[optionName]])
  }

  /**
   * (Testing utility)
   * Return all possible options that can be used to apply this operation on the given solid.
   */
  *allOptionCombos(solid: Forme) {
    if (!this.opArgs.allOptions) {
      // If allOptions is not defined, default to listing the options of the solid graph
      for (const entry of this.getEntries(solid)) {
        yield entry.options
      }
    } else {
      return cartesian(this.opArgs.allOptions(this.wrap(solid)))
    }
  }

  defaultOptions(solid: Forme) {
    return this.opArgs.defaultOptions(this.wrap(solid).specs)
  }

  selectionState(face: Face, solid: Forme, options: Options) {
    return this.opArgs.selectionState?.(face, this.wrap(solid), options)
  }
}

export function makeOperation<
  Options extends {} = {},
  Specs extends PolyhedronSpecs = PolyhedronSpecs,
  GraphOpts = Options
>(name: string, opArgs: OpArgs<Options, Specs, GraphOpts>) {
  return new Operation(name, opArgs)
}
