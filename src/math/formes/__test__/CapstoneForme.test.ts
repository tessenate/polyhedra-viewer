import { Edge } from "math/polyhedra"
import CapstoneForme from "../CapstoneForme"

describe("CapstoneForme", () => {
  describe("bases()", () => {
    it("returns two opposite edges for digonal antiprism", () => {
      const forme = CapstoneForme.fromName("digonal antiprism")
      const bases = forme.ends()
      expect(bases).toSatisfyAll((base) => base instanceof Edge)
      expect(bases[0].isInverse(bases[1]))
    })
    it("returns two opposite edges for snub digonal antiprism", () => {
      const forme = CapstoneForme.fromName("snub digonal antiprism")
      const bases = forme.ends()
      expect(bases).toSatisfyAll((base) => base instanceof Edge)
      expect(bases[0].isInverse(bases[1]))
    })
  })
})
