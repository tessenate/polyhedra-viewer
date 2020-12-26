import capstone from "./cutPasteCapstone"
import augmented from "./cutPasteAugmented"
import diminished from "./cutPasteDiminished"
import gyrated from "./cutPasteGyrate"
import elementary from "./cutPasteElementary"
import {
  capOptionArgs,
  augOptionArgs,
  CutPastePair,
  CutPasteSpecs,
} from "./cutPasteUtils"
import { combineOps } from "../operationPairs"
import { makeOperation } from "../Operation"

const ops: CutPastePair<CutPasteSpecs>[] = [
  capstone,
  augmented,
  diminished,
  gyrated,
  elementary,
]

export const augment = makeOperation("augment", {
  ...combineOps(ops.map((op) => op.augment)),
  ...augOptionArgs,
})

export const diminish = makeOperation("diminish", {
  ...combineOps(ops.map((op) => op.diminish)),
  ...capOptionArgs,
})

export { gyrate } from "./gyrate"
