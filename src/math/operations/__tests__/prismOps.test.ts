import { elongate, gyroelongate, shorten, turn } from "../prismOps"
import { validateOpInputs, validateHasOptions } from "../operationTestUtils"

describe("elongate", () => {
  it("canApplyTo", () => {
    validateOpInputs(elongate, {
      pass: [
        // only works on shortened capstones
        "triangular pyramid",
        "square cupola",
        "pentagonal rotunda",
        "pentagonal bipyramid",
        "triangular orthobicupola",
        "pentagonal orthocupolarotunda",
      ],
      fail: [
        "elongated triangular pyramid",
        "gyroelongated pentagonal bicupola",
        // doesn't work on fastigium
        // triangular prism
        "digonal gyrobicupola",
      ],
    })
  })
})

describe("gyroelongate", () => {
  it("canApplyTo", () => {
    validateOpInputs(gyroelongate, {
      pass: [
        "square cupola",
        "pentagonal rotunda",
        "pentagonal bipyramid",
        "triangular orthobicupola",
        "pentagonal orthocupolarotunda",
      ],
      fail: [
        // doesn't work when already elongated
        "gyroelongated pentagonal bicupola",
        // doesn't work on triangular pyramids
        "triangular pyramid",
        "triangular bipyramid",
        "elongated triangular pyramid",
        // doesn't work on fastigium
        // "triangular prism"
        "digonal gyrobicupola",
      ],
    })
  })

  it("hasOptions", () => {
    validateHasOptions(gyroelongate, {
      pass: [
        // has options on bicupolae/birotundae
        "square orthobicupola",
        "pentagonal gyrobirotunda",
        "pentagonal orthocupolarotunda",
      ],
      fail: ["pentagonal bipyramid", "pentagonal cupola"],
    })

    // false cases
  })
})

describe("shorten", () => {
  it("canApplyTo", () => {
    validateOpInputs(shorten, {
      pass: [
        "elongated square pyramid",
        "elongated triangular cupola",
        "gyroelongated pentagonal cupolarotunda",
      ],
      fail: [
        // invalid on prisms and shortened capstones
        "decagonal prism",
        "square antiprism",

        "pentagonal cupola",
        "pentagonal bipyramid",
      ],
    })
    // elongated and gyroelongated capstones
  })

  it("hasOptions", () => {
    validateHasOptions(shorten, {
      pass: [
        // true only if gyroelongated bicupola
        "gyroelongated square bicupola",
        "gyroelongated pentagonal cupolarotunda",
      ],
      fail: [
        // false for everything else
        "gyroelongated square cupola",
        "gyroelongated square bipyramid",
        "elongated square gyrobicupola",
      ],
    })
  })
})

describe("turn", () => {
  it("canApplyTo", () => {
    validateOpInputs(turn, {
      pass: [
        // all prismatics except digonal
        "square prism",
        "triangular antiprism",
        "pentagonal prism",
        "octagonal antiprism",
        // nonshortened capstones
        "gyroelongated pentagonal pyramid",
        "elongated square bipyramid",
        "elongated square cupola",
      ],
      fail: [
        "digonal antiprism",
        // false cases
        "square pyramid",
        "pentagonal orthocupolarotunda",

        // false on elongated triangular pyramid
        "elongated triangular pyramid",
        "elongated triangular bipyramid",
      ],
    })
  })

  it("hasOptions", () => {
    validateHasOptions(turn, {
      pass: [
        "elongated square gyrobicupola",
        "gyroelongated triangular bicupola",
        "elongated pentagonal gyrobirotunda",
        "gyroelongated pentagonal cupolarotunda",
      ],
      fail: [
        "pentagonal antiprism",
        "elongated square bipyramid",
        "gyroelongated square cupola",
      ],
    })
  })
})
