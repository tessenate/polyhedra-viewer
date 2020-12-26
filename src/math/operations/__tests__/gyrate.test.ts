import { gyrate } from "../cutPasteOps"
import { validateOpInputs } from "../operationTestUtils"

describe("gyrate", () => {
  describe("canApplyTo", () => {
    it("works on capstones", () => {
      validateOpInputs(gyrate, {
        pass: [
          // only birotundate, bicupolae, and cupolarotundae work
          "square orthobicupola",
          "elongated triangular gyrobicupola",
          "pentagonal orthobicupola",
          "gyroelongated pentagonal cupolarotunda",
        ],
        fail: [
          "square cupola",
          "elongated pentagonal cupola",
          "triangular bipyramid",
        ],
      })
    })

    it("works on gyrate solids", () => {
      validateOpInputs(gyrate, {
        pass: [
          "rhombicosidodecahedron",
          "trigyrate rhombicosidodecahedron",
          "metabidiminished rhombicosidodecahedron",
          "paragyrate diminished rhombicosidodecahedron",
        ],
        fail: [
          "parabidiminished rhombicosidodecahedron",
          "tridiminished rhombicosidodecahedron",
        ],
      })
    })
  })
})
