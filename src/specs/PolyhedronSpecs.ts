import { isEqual, capitalize } from "lodash-es"
import type Classical from "./Classical"
import type Capstone from "./Capstone"
import type Composite from "./Composite"
import type Elementary from "./Elementary"
import getSymmetry from "./getSymmetry"
import getName from "./getName"
import getConwaySymbol from "./getConwaySymbol"
import type { Symmetry } from "./symmetry"
import { getAlternateNames, getCanonicalName } from "data/alternates"

export type PolyhedronSpecs = Classical | Capstone | Composite | Elementary

type PolyhedronType =
  | "classical"
  | "capstone"
  | "composite"
  | "modified antiprism"
  | "elementary"

export default abstract class Specs<Data extends {} = {}> {
  type: PolyhedronType
  data: Data

  constructor(type: PolyhedronType, data: Data) {
    this.type = type
    this.data = data
  }

  name(): string {
    return getName(this)
  }

  canonicalName() {
    return getCanonicalName(this.name())
  }

  alternateNames() {
    return getAlternateNames(this.canonicalName())
  }

  symmetry(): Symmetry {
    return getSymmetry(this)
  }

  conwaySymbol(): string {
    return getConwaySymbol(this)
  }

  group() {
    if (this.isClassical()) {
      return this.isRegular() ? "Platonic solid" : "Archimedean solid"
    }
    if (this.isCapstone() && this.isPrismatic()) {
      return capitalize(this.prismaticType())
    }
    return "Johnson solid"
  }

  isUniform() {
    return this.isClassical() || (this.isCapstone() && this.isPrismatic())
  }

  isChiral() {
    // Should be overwritten by things that are chiral
    return false
  }

  equals(other: PolyhedronSpecs) {
    return this.type === other.type && isEqual(this.data, other.data)
  }

  /**
   * Returns whether the two specs represent the same underlying polyhedron.
   * In general, this is true if this.canonicalName() === s2.canonicalName()
   */
  equivalent(other: PolyhedronSpecs) {
    return this.unwrap().equals(other.unwrap())
  }

  isHoneycomb() {
    return [
      "cube",
      "truncated octahedron",
      "triangular prism",
      "hexagonal prism",
      "gyrobifastigium",
    ].includes(this.canonicalName())
  }

  isClassical(): this is Classical {
    return this.type === "classical"
  }

  isCapstone(): this is Capstone {
    return this.type === "capstone"
  }

  isComposite(): this is Composite {
    return this.type === "composite"
  }

  isElementary(): this is Elementary {
    return this.type === "elementary"
  }

  abstract unwrap(): PolyhedronSpecs
}
