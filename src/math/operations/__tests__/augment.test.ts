import { augment } from "../cutPasteOps"
import { validateOpInputs } from "../operationTestUtils"

// TODO test other methods:
// * defaultOptions
// * allOptions
describe("augment", () => {
  describe("canApplyTo", () => {
    it("works on capstones", () => {
      validateOpInputs(augment, {
        pass: [
          // prisms
          "square prism",
          "pentagonal prism",
          "octagonal antiprism",
          // other capstones
          "elongated triangular cupola",
          "square pyramid",
          "gyroelongated pentagonal rotunda",
        ],
        fail: [
          // not digonal antiprism
          "digonal antiprism",
          // does not work on bi capstones
          "pentagonal orthobicupola",
          "gyroelongated square bipyramid",

          // does not work on gyroelongated triangular
          "octahedron",
        ],
      })
    })

    it("works on augmented composites", () => {
      validateOpInputs(augment, {
        pass: [
          "dodecahedron",
          "augmented truncated cube",
          "metabiaugmented hexagonal prism",
        ],
        fail: [
          // false if maxed out
          "augmented truncated tetrahedron",
          "biaugmented pentagonal prism",
          "triaugmented dodecahedron",
          // false if parabiaugmented
          "parabiaugmented dodecahedron",
        ],
      })
    })

    it("works on diminished solids", () => {
      validateOpInputs(augment, {
        pass: [
          "diminished icosahedron",
          "metabidiminished icosahedron",
          "tridiminished icosahedron",
        ],
        fail: ["icosahedron", "augmented tridiminished icosahedron"],
      })
      // fully maxed out
    })

    it("works on gyrate solids", () => {
      validateOpInputs(augment, {
        pass: [
          "diminished rhombicosidodecahedron",
          "tridiminished rhombicosidodecahedron",
          "metagyrate diminished rhombicosidodecahedron",
        ],
        fail: [
          "rhombicosidodecahedron",
          // false if only gyrated
          "gyrate rhombicosidodecahedron",
          "metabigyrate rhombicosidodecahedron",
          "trigyrate rhombicosidodecahedron",
        ],
      })
    })

    it("works on elementary solids", () => {
      validateOpInputs(augment, {
        pass: ["sphenocorona"],
        fail: [],
      })
    })
  })
})
