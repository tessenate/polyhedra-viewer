import { compact } from "lodash-es"
import type Specs from "./PolyhedronSpecs"
import { PrimaryPolygon, polygonPrefixes } from "./common"

const countPrefixes: Record<number, string> = { 1: "", 2: "bi", 3: "tri" }

export function countString(count: number, base: string) {
  if (count === 0) return ""
  return `${countPrefixes[count]}${base}`
}

export function wordJoin(...array: (string | undefined)[]) {
  return compact(array).join(" ")
}

export function prefix(prefix: string = "", rest: string) {
  return `${prefix}${rest}`
}

const rectifiedNames = {
  3: "tetratetrahedron",
  4: "cuboctahedron",
  5: "icosidodecahedron",
}

const regularNames: Record<
  PrimaryPolygon,
  (facet?: "face" | "vertex") => string
> = {
  3: (facet) => (facet === "face" ? "tetrahedron" : "tetrahedron dual"),
  4: (facet) => (facet === "face" ? "cube" : "octahedron"),
  5: (facet) => (facet === "face" ? "dodecahedron" : "icosahedron"),
}

function getExpandedString(base: string, operation: string) {
  const str = prefix(operation === "cantellate" ? "rhombi" : "", base)
  return str.replace("ii", "i")
}

export default function getName(solid: Specs): string {
  if (solid.isClassical()) {
    const { operation, family, facet } = solid.data
    const base = solid.hasFacet()
      ? regularNames[family](facet)
      : rectifiedNames[family]
    return wordJoin(
      operation === "snub" ? operation : "",
      ["truncate", "bevel"].includes(operation) ? "truncated" : "",
      getExpandedString(base, operation),
    )
  }

  if (solid.isCapstone()) {
    const { base, elongation, count, gyrate } = solid.data
    // If no caps attached, it's a prism or antiprism
    if (solid.isPrismatic()) {
      return wordJoin(
        polygonPrefixes.get(solid.baseSides()),
        solid.prismaticType(),
      )
    }

    if (solid.isSnub()) {
      return wordJoin("snub", polygonPrefixes.get(base), "antiprism")
    }

    const elongStr = {
      prism: "elongated",
      antiprism: "gyroelongated",
      none: "",
      snub: "",
    }

    const baseStr = solid.isCupolaRotunda()
      ? "cupolarotunda"
      : countString(count, solid.capType())

    return wordJoin(
      elongStr[elongation],
      polygonPrefixes.get(base),
      prefix(gyrate, baseStr),
    )
  }

  if (solid.isComposite()) {
    const { augmented, gyrate, diminished, align, source } = solid.data
    return prefix(
      align,
      wordJoin(
        countString(augmented, "augmented"),
        countString(gyrate, "gyrate"),
        countString(diminished, "diminished"),
        source.name(),
      ),
    )
  }

  if (solid.isElementary()) {
    return solid.data.base
  }

  throw new Error(`Invalid solid of type ${solid.type}`)
}
