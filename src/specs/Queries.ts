import { pickBy, isMatch } from "lodash-es"
import { getSingle } from "utils"
import type Specs from "./PolyhedronSpecs"

type Predicate<T> = (arg: T) => boolean

// TODO use a similar naming convention to react-testing-library:
// https://testing-library.com/docs/dom-testing-library/api-queries
export default class Queries<S extends Specs> {
  entries: S[]
  nameMapping: Map<string, S>
  canonicalNameMapping: Map<string, S[]>
  constructor(entries: Iterable<S>) {
    this.entries = [...entries]
    this.canonicalNameMapping = new Map()
    this.nameMapping = new Map()
    for (const entry of this.entries) {
      this.nameMapping.set(entry.name(), entry)

      const canonicalName = entry.canonicalName()
      if (!this.canonicalNameMapping.has(canonicalName)) {
        this.canonicalNameMapping.set(canonicalName, [])
      }
      this.canonicalNameMapping.set(canonicalName, [
        ...this.canonicalNameMapping.get(canonicalName)!,
        entry,
      ])
    }
  }

  hasCanonicalName(name: string) {
    return this.canonicalNameMapping.has(name)
  }

  /** Get the entry with the given canonical name. */
  withCanonicalName(name: string) {
    if (!this.canonicalNameMapping.has(name)) {
      throw new Error(`Could not find entry with canonical name ${name}`)
    }
    return this.canonicalNameMapping.get(name)![0]
  }

  hasName(name: string) {
    return this.nameMapping.has(name)
  }

  withName(name: string) {
    const entry = this.nameMapping.get(name)
    if (!entry) throw new Error(`Could not find specs with name ${name}`)
    return entry
  }

  withData(data: S["data"]) {
    // Remove nullish elements from the filter
    const compact = pickBy(data, (data) => data !== undefined)
    return getSingle(this.entries.filter((item) => isMatch(item.data, compact)))
  }

  where(filter: Predicate<S>) {
    return this.entries.filter((entry) => filter(entry))
  }
}
