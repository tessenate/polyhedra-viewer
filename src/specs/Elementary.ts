import { Items } from "types"
import Specs from "./PolyhedronSpecs"
import Queries from "./Queries"

export const bases = [
  "sphenocorona",
  "augmented sphenocorona",
  "sphenomegacorona",
  "hebesphenomegacorona",
  "disphenocingulum",
  "bilunabirotunda",
  "triangular hebesphenorotunda",
] as const

type ElementaryBase = Items<typeof bases>

interface ElementaryData {
  base: ElementaryBase
}

export default class Elementary extends Specs<ElementaryData> {
  constructor(data: ElementaryData) {
    super("elementary", data)
  }

  unwrap = () => this

  static *getAll() {
    for (const base of bases) {
      yield new Elementary({ base })
    }
  }

  static query = new Queries(Elementary.getAll())
}
