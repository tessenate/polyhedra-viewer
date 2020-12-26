import { BiMap } from "bimap"
import { allSolidNames } from "data/common"
import { getCanonicalSpecs } from "specs"

function getConwayNotation(name: string) {
  return getCanonicalSpecs(name).conwaySymbol()
}

const conwayMapping = new BiMap(
  allSolidNames.map((name) => [name, getConwayNotation(name)]),
)

export function isConwayNotation(symbol: string) {
  return conwayMapping.hasValue(symbol)
}

export function fromConwayNotation(symbol: string) {
  return conwayMapping.of(symbol)
}
