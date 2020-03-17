import { toConwayNotation } from "./conway"
import { getAlternateNames } from "./alternates"
import {
  getSymmetry,
  getSymmetryName,
  getSymmetrySymbol,
  getOrder,
} from "./symmetry"
import { classicals, prisms, capstones, rhombicosidodecahedra } from "./tables"

/**
 * Class containing miscellaneous information about a CRF polyhedron
 * that can be gleaned outside of its geometry.
 */
export default class SolidInfo {
  name: string

  constructor(name: string) {
    this.name = name
  }

  alternateNames = () => getAlternateNames(this.name)

  symbol = () => toConwayNotation(this.name)

  symmetry = () => getSymmetry(this.name)

  symmetryName = () => getSymmetryName(this.symmetry())

  symmetrySymbol = () => getSymmetrySymbol(this.symmetry())

  order = () => getOrder(this.symmetry())

  inClassicalTable(filter?: Parameters<typeof classicals.hasName>[1]) {
    return classicals.hasName(this.name, filter)
  }

  inPrismTable(filter?: Parameters<typeof prisms.hasName>[1]) {
    return prisms.hasName(this.name, filter)
  }

  inCapstoneTable(filter?: Parameters<typeof capstones.hasName>[1]) {
    return capstones.hasName(this.name, filter)
  }

  inRhombicosidodecahedronTable(
    filter?: Parameters<typeof rhombicosidodecahedra.hasName>[1],
  ) {
    return rhombicosidodecahedra.hasName(this.name, filter)
  }

  type() {
    if (this.inClassicalTable({ operation: "regular" })) {
      return "Platonic solid"
    }
    if (this.inClassicalTable()) {
      return "Archimedean solid"
    }
    if (this.inPrismTable({ type: "prism" })) {
      return "Prism"
    }
    if (this.inPrismTable({ type: "antiprism" })) {
      return "Antiprism"
    }
    return "Johnson solid"
  }

  isRegular() {
    return this.inClassicalTable({ operation: "regular" })
  }

  /**
   * A polyhedron is quasiregular if it has exactly two types of regular faces,
   * which alternate around each vertex.
   */
  isQuasiRegular() {
    return this.inClassicalTable({ operation: "rectify" })
  }

  isUniform() {
    return this.inClassicalTable() || this.inPrismTable()
  }

  isChiral() {
    return (
      this.inClassicalTable(
        ({ family, operation }) => operation === "snub" && family !== 3,
      ) ||
      this.inCapstoneTable(
        ({ elongation, count, type }) =>
          elongation === "antiprism" && count === 2 && type !== "pyramid",
      )
    )
  }

  /**
   * Returns `true` if the polyhedron can tile space.
   */
  isHoneycomb() {
    return [
      "cube",
      "truncated octahedron",
      "triangular prism",
      "hexagonal prism",
      "gyrobifastigium",
    ].includes(this.name)
  }
}
