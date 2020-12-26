import { Items } from "types"

import Specs from "./PolyhedronSpecs"
import Queries from "./Queries"
import Classical from "./Classical"
import Capstone from "./Capstone"

export const counts = [0, 1, 2, 3] as const
export type Count = Items<typeof counts>

export const alignments = ["para", "meta"] as const
export type Align = Items<typeof alignments>

interface CompositeData {
  source: Classical | Capstone
  augmented: Count
  diminished: Count
  gyrate: Count
  align?: Align
}

interface CompositeDataArgs extends Partial<CompositeData> {
  source: Classical | Capstone
}

const prismaticBases = Capstone.query.where(
  (s) => s.isPrism() && (s.isPrimary() || s.isTriangular()),
)
const augmentedClassicalBases = Classical.query.where(
  (s) => s.hasFacet() && !s.isVertex(),
)
const diminishedNames = ["octahedron", "icosahedron"]
const diminishedBases = diminishedNames.map((name) =>
  Classical.query.withName(name),
)
const gyrateBases = Classical.query.where(
  (s) => s.isCantellated() /* && s.isIcosahedral(), */,
)

const sources = [
  ...prismaticBases,
  ...augmentedClassicalBases,
  ...diminishedBases,
  ...gyrateBases,
]

function limitCount(limit: number) {
  return counts.filter((n) => n <= limit)
}

/**
 * A composite Johnson solid consists of a Uniform polyhedron
 * with pyramids or cupolae added, removed, or gyrated from it.
 */
export default class Composite extends Specs<CompositeData> {
  private constructor(data: CompositeDataArgs) {
    super("composite", Composite.cleanData(data))
  }

  withData(data: Partial<CompositeData>) {
    return Composite.query.withData(
      Composite.cleanData({ ...this.data, ...data }),
    )
  }

  totalCount() {
    const { augmented, diminished, gyrate } = this.data
    return augmented + diminished + gyrate
  }

  isMono = () => this.totalCount() === 1
  isBi = () => this.totalCount() === 2
  isTri = () => this.totalCount() === 3

  isAugmented = () => this.data.augmented > 0
  isDiminished = () => this.data.diminished > 0
  isGyrate = () => this.data.gyrate > 0

  isAugmentedPrism() {
    return this.data.source.isCapstone()
  }

  isAugmentedClassical() {
    const { source } = this.data
    if (!source.isClassical()) return false
    if (source.isTruncated()) return true
    return source.isRegular() && source.isFace()
  }

  isAugmentedSolid() {
    return this.isAugmentedPrism() || this.isAugmentedClassical()
  }

  isDiminishedSolid() {
    const { source } = this.data
    return source.isClassical() && source.isRegular() && source.isVertex()
  }

  isGyrateSolid() {
    const { source } = this.data
    return source.isClassical() && source.isCantellated()
  }

  isPara = () => this.data.align === "para"
  isMeta = () => this.data.align === "meta"

  unwrap() {
    return this.totalCount() === 0 ? this.data.source : this
  }

  hasAlignment() {
    return Composite.hasAlignment(this.data)
  }

  sourcePrism() {
    const { source } = this.data
    if (!source.isCapstone()) {
      throw new Error(`Source is not a prism: ${source.name()}`)
    }
    return source
  }

  sourceClassical() {
    const { source } = this.data
    if (!source.isClassical()) {
      throw new Error(`Source is not a classical solid: ${source.name()}`)
    }
    return source
  }

  augmentFaceType() {
    if (!this.isAugmentedSolid())
      throw new Error(`augmentFaceType() only implemented for augmented solids`)
    if (this.isAugmentedPrism()) return 4
    const source = this.sourceClassical()
    return source.data.family * (source.isTruncated() ? 2 : 1)
  }

  diminish() {
    if (!this.isAugmentedSolid())
      throw new Error(`diminish() only implemented for augmented solids`)
    return this.withData({
      augmented: (this.data.augmented - 1) as Count,
      align: "meta",
    })
  }

  augmentDiminished(triangular?: boolean) {
    if (!this.isDiminishedSolid())
      throw new Error(
        `augmentDiminished() only implemented for diminished solids`,
      )
    if (triangular) {
      return this.withData({ augmented: 1 })
    }
    return this.withData({
      diminished: (this.data.diminished - 1) as Count,
      align: "meta",
    })
  }

  augmentGyrate(gyrate: "ortho" | "gyro") {
    if (!this.isGyrateSolid())
      throw new Error(`augmentGyrate() only implemented for gyrate solids`)
    if (gyrate === "ortho") {
      return this.withData({
        gyrate: (this.data.gyrate + 1) as Count,
        diminished: (this.data.diminished - 1) as Count,
      })
    }
    return this.withData({
      diminished: (this.data.diminished - 1) as Count,
      align: "meta",
    })
  }

  ungyrate() {
    return this.withData({
      gyrate: (this.data.gyrate - 1) as Count,
      align: "meta",
    })
  }

  static hasSource(source: Classical | Capstone) {
    return sources.some((s) => s.equals(source))
  }

  static wrap(source: Classical | Capstone) {
    return this.query.withData({
      source,
      augmented: 0,
      diminished: 0,
      gyrate: 0,
    })
  }

  static hasAlignment({
    source,
    augmented = 0,
    diminished = 0,
    gyrate = 0,
  }: CompositeDataArgs) {
    const count = augmented + diminished + gyrate
    if (count !== 2) return false
    // Only hexagonal prism has alignment
    if (source.isCapstone()) return source.isSecondary()
    // Only dodecahedra and icosahedra have alignments
    if (source.isClassical()) return source.isIcosahedral()
    return false
  }

  private static cleanData(data: CompositeDataArgs): CompositeData {
    if (!this.hasAlignment(data)) {
      delete data.align
    }
    return { augmented: 0, diminished: 0, gyrate: 0, ...data }
  }

  static *getWithAlignments(data: CompositeDataArgs) {
    if (this.hasAlignment(data)) {
      for (const align of alignments) {
        yield new Composite({ ...data, align })
      }
    } else {
      yield new Composite(data)
    }
  }

  static augmentLimit(source: Capstone | Classical) {
    if (source.isCapstone()) return source.data.base % 3 === 0 ? 3 : 2
    return source.data.family - 2
  }

  static diminishLimit(source: Classical) {
    return source.isIcosahedral() ? 3 : 1
  }

  static *gyrateMods(
    source: Classical,
  ): Generator<{ diminished?: Count; gyrate?: Count }> {
    // FIXME this can actually be simplified!
    switch (source.data.family) {
      case 3: {
        yield {}
        yield { gyrate: 1 }
        yield { diminished: 1 }
        break
      }
      case 4: {
        yield {}
        yield { gyrate: 1 }
        yield { gyrate: 2 }
        yield { diminished: 1 }
        yield { gyrate: 1, diminished: 1 }
        yield { diminished: 2 }
        break
      }
      case 5: {
        for (const gyrate of counts) {
          for (const diminished of limitCount(3 - gyrate)) {
            yield { gyrate, diminished }
          }
        }
        break
      }
    }
  }

  static *getAll() {
    // Augmented solids
    for (const source of [...prismaticBases, ...augmentedClassicalBases]) {
      for (const augmented of limitCount(this.augmentLimit(source))) {
        yield* this.getWithAlignments({ source, augmented })
      }
    }

    // Diminished solids
    for (const source of diminishedBases) {
      for (const diminished of limitCount(this.diminishLimit(source))) {
        yield* this.getWithAlignments({ source, diminished })
      }
      if (source.isIcosahedral()) {
        yield new Composite({ source, diminished: 3, augmented: 1 })
      }
    }

    // Gyrate and diminished solids
    for (const source of gyrateBases) {
      for (const mods of this.gyrateMods(source)) {
        yield* this.getWithAlignments({
          source,
          ...mods,
        })
      }
    }
  }

  static query = new Queries(Composite.getAll())
}
