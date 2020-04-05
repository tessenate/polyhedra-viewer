import { mapValues, isEmpty, uniq } from "lodash-es"

import { getAllSpecs } from "data/specs/getSpecs"
import { Vec3D, vec, PRECISION } from "math/geom"
import { Polyhedron, Vertex, VertexArg, normalizeVertex } from "math/polyhedra"
import { removeExtraneousVertices } from "./operationUtils"
import { Point } from "types"
import PolyhedronSpecs from "data/specs/PolyhedronSpecs"

type SelectState = "selected" | "selectable" | undefined

export interface AnimationData {
  start: Polyhedron
  endVertices: Point[]
}

export interface OperationResult {
  result: Polyhedron
  animationData?: AnimationData
}

interface BaseOperation<Options extends {}> {
  hitOption?: keyof Options
}

export interface Operation<Options extends {}> extends BaseOperation<Options> {
  name: string

  apply(polyhedron: Polyhedron, options: Options): OperationResult

  canApplyTo(polyhedron: Polyhedron): boolean

  getHitOption(polyhedron: Polyhedron, hitPnt: Point, options: Options): Options

  /**
   * @return whether this operation has multiple options for the given polyhedron.
   */
  hasOptions(polyhedron: Polyhedron): boolean

  /**
   * @return all the options for the given option name.
   */
  allOptions(
    polyhedron: Polyhedron,
    optionName: keyof Options,
  ): Options[typeof optionName][]

  allOptionCombos(polyhedron: Polyhedron): Generator<Options>

  /**
   * Return the default selected apply options when an operation is
   * selected on a polyhedron.
   */
  defaultOptions(polyhedron: Polyhedron): Partial<Options>

  /**
   * Given an application of an operation to a given polyhedron with the given options,
   * @return an array mapping face indices to selection states (selectable, selected, or none).
   */
  faceSelectionStates(polyhedron: Polyhedron, options: Options): SelectState[]
}

interface PartialOpResult {
  result?: Polyhedron
  animationData?: {
    start: Polyhedron
    endVertices: VertexArg[]
  }
}

interface SolidArgs<Specs extends PolyhedronSpecs> {
  specs: Specs
  geom: Polyhedron
}

interface OperationArgs<Options extends {}, Specs extends PolyhedronSpecs>
  extends Partial<BaseOperation<Options>> {
  canApplyTo(info: PolyhedronSpecs): info is Specs

  hasOptions?(info: Specs): boolean

  isPreferredSpec?(info: Specs, options: Options): boolean

  apply(
    solid: SolidArgs<Specs>,
    options: Options,
    result: Polyhedron,
  ): PartialOpResult | Polyhedron

  allOptions?(
    solid: SolidArgs<Specs>,
    optionName: keyof Options,
  ): Options[typeof optionName][]

  allOptionCombos?(solid: SolidArgs<Specs>): Generator<Options>

  getResult(solid: SolidArgs<Specs>, options: Options): PolyhedronSpecs

  getHitOption?(
    solid: SolidArgs<Specs>,
    hitPnt: Vec3D,
    options: Options,
  ): Partial<Options>

  defaultOptions?(info: Specs): Partial<Options>

  faceSelectionStates?(solid: SolidArgs<Specs>, options: Options): SelectState[]
}

type OperationArg = keyof OperationArgs<any, any>
const methodDefaults = {
  getHitOption: {},
  hasOptions: false,
  allOptionCombos: [null],
  isPreferredSpec: true,
  faceSelectionStates: [],
  defaultOptions: {},
}

// TODO get this to return the correct type
function fillDefaults<Options extends {}, Specs extends PolyhedronSpecs>(
  op: OperationArgs<Options, Specs>,
) {
  return {
    ...mapValues(
      methodDefaults,
      (fnDefault, fn: OperationArg) => op[fn] ?? (() => fnDefault),
    ),
    ...op,
  }
}

function normalizeOpResult(
  opResult: PartialOpResult | Polyhedron,
  newName: string,
): OperationResult {
  if (opResult instanceof Polyhedron) {
    return { result: deduplicateVertices(opResult).withName(newName) }
  }
  const { result, animationData } = opResult
  const { start, endVertices } = animationData!

  const normedResult =
    result ?? deduplicateVertices(start.withVertices(endVertices))

  return {
    result: normedResult.withName(newName),
    animationData: {
      start,
      endVertices: endVertices.map(normalizeVertex),
    },
  }
}

// Remove vertices (and faces) from the polyhedron when they are all the same
export function deduplicateVertices(polyhedron: Polyhedron) {
  // group vertex indices by same
  const unique: Vertex[] = []
  const oldToNew: Record<number, number> = {}

  polyhedron.vertices.forEach((v, vIndex) => {
    const match = unique.find((point) =>
      v.vec.equalsWithTolerance(point.vec, PRECISION),
    )
    if (match === undefined) {
      unique.push(v)
      oldToNew[vIndex] = vIndex
    } else {
      oldToNew[vIndex] = match.index
    }
  })

  if (isEmpty(oldToNew)) return polyhedron

  // replace vertices that are the same
  let newFaces = polyhedron.faces
    .map((face) => uniq(face.vertices.map((v) => oldToNew[v.index])))
    .filter((vIndices) => vIndices.length >= 3)

  // remove extraneous vertices
  return removeExtraneousVertices(polyhedron.withFaces(newFaces))
}

export default function makeOperation<
  Specs extends PolyhedronSpecs,
  Options extends {} = {}
>(name: string, op: OperationArgs<Options, Specs>): Operation<Options> {
  const withDefaults = fillDefaults(op)

  // TODO we have to calculate this with every operation...
  // I wish I could store it in a class or something to get it to work right
  function* validSpecs(polyhedron: Polyhedron): Generator<Specs> {
    for (const specs of getAllSpecs(polyhedron.name)) {
      if (withDefaults.canApplyTo(specs)) {
        yield specs
      }
    }
  }

  function getValidSpecs(polyhedron: Polyhedron) {
    return [...validSpecs(polyhedron)]
  }

  return {
    ...(withDefaults as any),
    name,
    apply(geom, options) {
      const specs = getValidSpecs(geom).find((info) =>
        withDefaults.isPreferredSpec!(info, options),
      )
      if (!specs)
        throw new Error(`Could not find specs for polyhedron ${geom.name}`)

      // get the next polyhedron name
      const next = withDefaults.getResult!(
        { specs, geom },
        options ?? {},
      ).canonicalName()

      // Get the actual operation result
      const opResult = withDefaults.apply(
        { specs, geom },
        options ?? {},
        Polyhedron.get(next),
      )
      return normalizeOpResult(opResult, next)
    },
    getHitOption(geom, hitPnt, options) {
      // TODO think of situations where this wouldn't be okay
      const specs = getValidSpecs(geom)[0]
      return withDefaults.getHitOption!({ specs, geom }, vec(hitPnt), options)
    },
    canApplyTo(polyhedron) {
      return getValidSpecs(polyhedron).length > 0
    },
    hasOptions(polyhedron) {
      return getValidSpecs(polyhedron).some(withDefaults.hasOptions!)
    },
    allOptions(geom, optionName) {
      return withDefaults.allOptions!(
        { specs: getValidSpecs(geom)[0], geom },
        optionName,
      )
    },
    *allOptionCombos(geom) {
      for (const specs of getValidSpecs(geom)) {
        yield* withDefaults.allOptionCombos!({ specs, geom })
      }
    },
    defaultOptions(polyhedron) {
      return withDefaults.defaultOptions!(getValidSpecs(polyhedron)[0])
    },
    faceSelectionStates(geom, options) {
      return withDefaults.faceSelectionStates!(
        { specs: getValidSpecs(geom)[0], geom },
        options,
      )
    },
  }
}
