import { Items } from "types"
import { PrimaryPolygon, primaryPolygons, Twist, twists } from "./common"
import Specs from "./PolyhedronSpecs"
import Queries from "./Queries"

export const families = primaryPolygons
export type Family = PrimaryPolygon

export const facetTypes = ["face", "vertex"] as const
export type FacetType = Items<typeof facetTypes>
export function oppositeFacet(facet: FacetType) {
  return facet === "face" ? "vertex" : "face"
}

export const operations = [
  "regular",
  "truncate",
  "rectify",
  "bevel",
  "cantellate",
  "snub",
] as const
export type Operation = Items<typeof operations>

interface ClassicalData {
  family: Family
  facet?: FacetType
  operation: Operation
  twist?: Twist
}

/**
 * An classical uniform polyhedron is a Platonic or Archimedean solid.
 */
export default class Classical extends Specs<ClassicalData> {
  private constructor(data: ClassicalData) {
    super("classical", Classical.cleanData(data))
  }

  unwrap = () => this

  withData(data: Partial<ClassicalData>) {
    return Classical.query.withData(
      Classical.cleanData({ ...this.data, ...data }),
    )
  }

  withOperation(operation: Operation, twist?: Twist) {
    return this.withData({ operation, twist })
  }

  isTetrahedral = () => this.data.family === 3
  isOctahedral = () => this.data.family === 4
  isIcosahedral = () => this.data.family === 5

  isRegular = () => this.data.operation === "regular"
  isTruncated = () => this.data.operation === "truncate"
  isRectified = () => this.data.operation === "rectify"
  isBevelled = () => this.data.operation === "bevel"
  isCantellated = () => this.data.operation === "cantellate"
  isSnub = () => this.data.operation === "snub"

  hasFacet = () => Classical.hasFacet(this.data.operation)
  facet() {
    if (!this.data.facet) throw new Error(`Spec ${this.name()} has no facet`)
    return this.data.facet
  }

  isFace = () => this.data.facet === "face"
  isVertex = () => this.data.facet === "vertex"

  isChiral = () => this.isSnub()

  static hasFacet(operation: Operation) {
    return ["regular", "truncate"].includes(operation)
  }

  private static cleanData(data: ClassicalData) {
    if (!this.hasFacet(data.operation)) {
      delete data.facet
    }
    if (data.operation !== "snub") {
      delete data.twist
    }
    // Set a default twist for snub solids
    if (data.operation === "snub" && !data.twist) {
      data.twist = "left"
    }
    return data
  }

  static *getAll() {
    for (const operation of operations) {
      for (const family of families) {
        if (this.hasFacet(operation)) {
          for (const facet of facetTypes) {
            yield new Classical({ family, operation, facet })
          }
        } else if (operation === "snub") {
          for (const twist of twists) {
            yield new Classical({ family, operation, twist })
          }
        } else {
          yield new Classical({ family, operation })
        }
      }
    }
  }

  static query = new Queries(Classical.getAll())

  static allWithOperation(operation: Operation) {
    return this.query.where((s) => s.data.operation === operation)
  }
}
