import { expand, snub, contract, dual, twist } from "../resizeOps"
import { validateOpInputs, validateHasOptions } from "../operationTestUtils"

describe("expand", () => {
  it("canApplyTo", () => {
    validateOpInputs(expand, {
      pass: ["cube", "truncated dodecahedron"],
      fail: [],
    })
  })
})

describe("snub", () => {
  it("canApplyTo", () => {
    validateOpInputs(snub, {
      pass: ["cube", "dodecahedron"],
      fail: ["truncated dodecahedron"],
    })
  })

  it("hasOptions", () => {
    validateHasOptions(snub, {
      pass: ["cube", "icosahedron", "tetrahedron"],
      fail: [],
    })
  })
})

describe("dual", () => {
  it("canApplyTo", () => {
    validateOpInputs(dual, {
      pass: ["cube", "dodecahedron", "tetrahedron"],
      fail: ["truncated dodecahedron"],
    })
  })
})

describe("contract", () => {
  it("canApplyTo", () => {
    validateOpInputs(contract, {
      pass: [
        // cantellated solids
        "rhombitetratetrahedron",
        "rhombicuboctahedron",
        "rhombicosidodecahedron",
        // snub solids
        "snub tetratetrahedron",
        "snub cuboctahedron",
        "snub icosidodecahedron",
        // bevelled polyhedra
        "truncated tetratetrahedron",
        "truncated cuboctahedron",
        "truncated icosidodecahedron",
      ],
      fail: [],
    })
  })

  it("hasOptions", () => {
    validateHasOptions(contract, {
      // true for all
      pass: [
        "rhombicuboctahedron",
        "snub icosidodecahedron",
        "truncated tetratetrahedron",
      ],
      fail: [],
    })
  })
})

describe("twist", () => {
  it("canApplyTo", () => {
    validateOpInputs(twist, {
      pass: [
        // cantellated
        "rhombitetratetrahedron",
        "rhombicuboctahedron",
        "rhombicosidodecahedron",
        // snub
        "snub tetratetrahedron",
        "snub cuboctahedron",
        "snub icosidodecahedron",
      ],
      fail: [],
    })
  })

  it("hasOptions", () => {
    validateHasOptions(twist, {
      pass: [
        // cantellated
        "rhombitetratetrahedron",
        "rhombicuboctahedron",
        "rhombicosidodecahedron",
      ],
      fail: [
        // snub
        "snub tetratetrahedron",
        "snub cuboctahedron",
        "snub icosidodecahedron",
      ],
    })
  })
})
