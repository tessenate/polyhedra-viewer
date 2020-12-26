import { diminish } from "../cutPasteOps"
import { validateOpInputs } from "../operationTestUtils"

describe("diminish", () => {
  describe("canApplyTo", () => {
    it("works on capstones", () => {
      validateOpInputs(diminish, {
        pass: [
          // most capstones can be diminished
          "elongated square pyramid",
          "gyroelongated triangular cupola",
          "pentagonal orthobirotunda",
          "gyroelongated pentagonal cupolarotunda",
        ],
        fail: [
          // prisms and antiprims can't be diminished
          "square prism",
          "octagonal antiprism",
          "decagonal prism",
          // single capstones can't be diminished
          "square pyramid",
          "triangular cupola",
          "pentagonal rotunda",
        ],
      })
    })

    it("works on augmented composites", () => {
      validateOpInputs(diminish, {
        pass: [
          // valid on everything
          "augmented pentagonal prism",
          "parabiaugmented hexagonal prism",
          "triaugmented dodecahedron",
        ],
        fail: [
          "hexagonal prism",
          // false on the sources
          "cube",
          "truncated tetrahedron",
        ],
      })
    })

    it("works on diminished solids", () => {
      validateOpInputs(diminish, {
        pass: [
          "icosahedron",
          "metabidiminished icosahedron",
          "augmented tridiminished icosahedron",
        ],
        fail: ["tridiminished icosahedron", "parabidiminished icosahedron"],
      })
    })

    it("works on gyrate solids", () => {
      validateOpInputs(diminish, {
        pass: [
          "rhombicosidodecahedron",
          "trigyrate rhombicosidodecahedron",
          "metabidiminished rhombicosidodecahedron",
          "paragyrate diminished rhombicosidodecahedron",
          "gyrate bidiminished rhombicosidodecahedron",
        ],
        fail: [
          "tridiminished rhombicosidodecahedron",
          "parabidiminished rhombicosidodecahedron",
        ],
      })
    })

    it("works on elementary solids", () => {
      validateOpInputs(diminish, {
        pass: ["augmented sphenocorona"],
        fail: ["sphenocorona"],
      })
    })
  })
})
