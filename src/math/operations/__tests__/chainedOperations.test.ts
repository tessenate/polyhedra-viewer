import { FacetType } from "specs"
import { getSpecs } from "specs"
import { OpName, operations } from "math/operations"
import { PolyhedronForme, createForme, fromName } from "math/formes"
import { validateOperationApplication } from "../operationTestUtils"

interface Args {
  face?: number
  facet?: FacetType
  cap?: boolean
}

type ChainedOpName = OpName | "forme"
type OpInfoArray = [ChainedOpName, string]

interface OpInfoObject {
  op: ChainedOpName
  args: Args
  expected: string
}

type OpInfo = OpInfoArray | OpInfoObject

// Translate the test argument into an operation argument
function getArgs(args: Args, polyhedron: PolyhedronForme) {
  if (args.face) {
    return { ...args, face: polyhedron.geom.faceWithNumSides(args.face) }
  }
  if (args.cap) {
    // TODO support cupolae
    return { ...args, cap: polyhedron.caps()[0] }
  }
  return args
}

function getOpInfo(opInfo: OpInfo, polyhedron: PolyhedronForme) {
  if (Array.isArray(opInfo)) {
    const [op, expected] = opInfo
    return { op, expected }
  }
  const { op, args, expected } = opInfo
  return {
    op,
    expected,
    args: getArgs(args, polyhedron),
  }
}

interface OpTest {
  description: string
  start: string
  operations: OpInfo[]
  skip?: boolean
}

const chainedTests: OpTest[] = [
  {
    description: "pyramid operations",
    start: "square pyramid",
    operations: [
      { op: "augment", args: { face: 4 }, expected: "square bipyramid" },
      {
        op: "diminish",
        args: { cap: true },
        expected: "square pyramid",
      },
      ["elongate", "elongated square pyramid"],
    ],
  },
  {
    description: "combining twist and turn operations",
    start: "elongated pentagonal bipyramid",
    operations: [
      ["turn", "gyroelongated pentagonal bipyramid"],
      ["forme", "snub tetratetrahedron"],
      ["twist", "rhombitetratetrahedron"],
      ["twist", "snub tetratetrahedron"],
      ["forme", "gyroelongated pentagonal bipyramid"],
      ["turn", "elongated pentagonal bipyramid"],
    ],
  },
  {
    description: "augmenting and contracting icosahedron",
    start: "gyroelongated pentagonal pyramid",
    operations: [
      {
        op: "augment",
        args: { face: 5 },
        expected: "gyroelongated pentagonal bipyramid",
      },
      ["forme", "snub tetratetrahedron"],
      { op: "contract", args: { facet: "face" }, expected: "tetrahedron" },
    ],
  },
  {
    description: "rhombicuboctahedron expansion/contraction",
    start: "cube",
    operations: [
      ["expand", "rhombicuboctahedron"],
      { op: "contract", args: { facet: "face" }, expected: "cube" },
      ["expand", "rhombicuboctahedron"],
      { op: "contract", args: { facet: "vertex" }, expected: "octahedron" },
    ],
  },
  {
    description: "dodecahedron -> rectify -> unrectify -> contract",
    start: "dodecahedron",
    operations: [
      ["rectify", "icosidodecahedron"],
      { op: "sharpen", args: { facet: "vertex" }, expected: "icosahedron" },
      ["forme", "snub tetratetrahedron"],
      ["contract", "tetrahedron"],
    ],
  },
  {
    description: "truncation and rectification",
    start: "tetrahedron",
    operations: [
      ["truncate", "truncated tetrahedron"],
      ["sharpen", "tetrahedron"],
      ["rectify", "tetratetrahedron"],
      ["rectify", "rhombitetratetrahedron"],
      ["forme", "cuboctahedron"],
      ["truncate", "truncated cuboctahedron"],
      ["sharpen", "cuboctahedron"],
      { op: "sharpen", args: { facet: "face" }, expected: "cube" },
      ["truncate", "truncated cube"],
      {
        op: "augment",
        args: { face: 8 },
        expected: "augmented truncated cube",
      },
    ],
  },
  {
    description: "dodecahedron -> expand -> diminish",
    start: "dodecahedron",
    operations: [
      ["expand", "rhombicosidodecahedron"],
      {
        op: "diminish",
        args: { cap: true },
        expected: "diminished rhombicosidodecahedron",
      },
    ],
  },
  {
    // Make sure the Pose is fine in a chained operation
    description: "truncating/sharpening augmented classicals",
    start: "triaugmented truncated dodecahedron",
    operations: [
      {
        op: "diminish",
        args: { cap: true },
        expected: "metabiaugmented truncated dodecahedron",
      },
      ["sharpen", "metabiaugmented dodecahedron"],
    ],
  },
  {
    description: "Augmented prisms",
    start: "elongated pentagonal bipyramid",
    operations: [
      {
        op: "diminish",
        args: { cap: true },
        expected: "elongated pentagonal pyramid",
      },
      {
        op: "diminish",
        args: { cap: true },
        expected: "pentagonal prism",
      },
      {
        op: "augment",
        args: { face: 4 },
        expected: "augmented pentagonal prism",
      },
    ],
  },
]

function doOperationStep(opInfo: OpInfo, forme: PolyhedronForme) {
  const { op, args, expected } = getOpInfo(opInfo, forme)
  if (op === "forme") {
    const nextSpecs = getSpecs(expected)
    expect(forme.specs.canonicalName()).toEqual(nextSpecs.canonicalName())
    return createForme(nextSpecs, forme.geom)
  }
  const operation = operations[op]
  expect(forme).toSatisfy((p) => operation.canApplyTo(p))
  const { result } = validateOperationApplication(operation, forme, args)

  expect(result.specs.name()).toEqual(expected)
  return result
}

describe("chained operations", () => {
  for (const test of chainedTests) {
    const { start, description, operations, skip } = test
    if (skip) {
      xit(description, () => {})
      continue
    }
    let polyhedron = fromName(start)
    it(description, () => {
      for (const opInfo of operations) {
        polyhedron = doOperationStep(opInfo, polyhedron)
      }
    })
  }
})
