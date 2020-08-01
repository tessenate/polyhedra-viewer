import { pickBy, isMatch } from "lodash-es"
import { getSingle, find } from "utils"
import type Specs from "./PolyhedronSpecs"

type Predicate<T> = (arg: T) => boolean

// TODO use a similar naming convention to react-testing-library:
// https://testing-library.com/docs/dom-testing-library/api-queries
export default class Queries<S extends Specs> {
  entries: S[]
  nameMapping: Map<string, S[]>
  constructor(entries: Iterable<S>) {
    this.entries = [...entries]
    this.nameMapping = new Map()
    for (const entry of this.entries) {
      const name = entry.canonicalName()
      if (!this.nameMapping.has(name)) {
        this.nameMapping.set(name, [])
      }
      this.nameMapping.set(name, [...this.nameMapping.get(name)!, entry])
    }
  }

  hasName(name: string) {
    return this.nameMapping.has(name)
  }

  // FIXME replace the other functions with this when we're ready
  hasName2(name: string) {
    return this.entries.some((entry) => entry.name() === name)
  }

  withName2(name: string) {
    return find(this.entries, (entry) => entry.name() === name)
  }

  withData(data: S["data"]) {
    // Remove nullish elements from the filter
    const compact = pickBy(data, (data) => data !== undefined)
    return getSingle(this.entries.filter((item) => isMatch(item.data, compact)))
  }

  /**
   * Get the entry with the given canonical name.
   */
  withName(name: string) {
    if (!this.nameMapping.has(name)) {
      throw new Error(`Could not find entry with canonical name ${name}`)
    }
    return this.nameMapping.get(name)![0]
  }

  allWithName(name: string) {
    if (!this.nameMapping.has(name)) {
      throw new Error(`Could not find entry with canonical name ${name}`)
    }
    return this.nameMapping.get(name)!
  }

  where(filter: Predicate<S>) {
    return this.entries.filter((entry) => filter(entry))
  }
}
