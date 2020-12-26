import { truncate, rectify, sharpen } from "../truncateOps"
import { validateOpInputs, validateHasOptions } from "../operationTestUtils"

describe("truncate", () => {
  it("canApplyTo", () => {
    validateOpInputs(truncate, {
      pass: [
        "tetrahedron",
        "cube",
        "icosahedron",
        // rectified polyhedra
        "cuboctahedron",
        "icosidodecahedron",
      ],
      fail: [],
    })
  })

  it("hasOptions", () => {
    validateHasOptions(truncate, {
      pass: [],
      fail: ["tetrahedron", "icosahedron", "cuboctahedron"],
    })
  })
})

describe("rectify", () => {
  it("canApplyTo", () => {
    validateOpInputs(rectify, {
      pass: [
        "tetrahedron",
        "cube",
        "icosahedron",
        // rectified polyhedra
        "cuboctahedron",
        "icosidodecahedron",
      ],
      fail: [],
    })
  })
})

describe("sharpen", () => {
  it("canApplyTo", () => {
    validateOpInputs(sharpen, {
      pass: [
        // truncated solids
        "truncated tetrahedron",
        "truncated cube",
        "truncated icosahedron",
        // bevelled solids
        "truncated cuboctahedron",
        "truncated icosidodecahedron",
        // rectified solids
        "tetratetrahedron",
        "cuboctahedron",
        "icosidodecahedron",
        // cantellated solids
        "rhombicuboctahedron",
        "rhombicosidodecahedron",
      ],
      fail: [],
    })
  })

  it("hasOptions", () => {
    validateHasOptions(sharpen, {
      pass: ["cuboctahedron", "icosidodecahedron"],
      fail: [
        "truncated tetratetrahedron",
        "truncated cuboctahedron",
        "truncated icosahedron",
      ],
    })
  })
})
