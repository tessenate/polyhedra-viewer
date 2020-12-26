import { Composite } from "specs"
import { makeCutPastePair } from "./cutPasteUtils"

export default makeCutPastePair<Composite>({
  graph: function* () {
    // Pick every diminished icosahedron except the tridiminished augmented
    for (const solid of Composite.query.where(
      (s) => s.isDiminishedSolid() && s.isDiminished() && !s.isAugmented(),
    )) {
      const faceType = solid.sourceClassical().data.family
      const options = solid.isTri() ? [3, faceType] : [faceType]
      for (const faceType of options) {
        yield {
          left: solid,
          right: solid.augmentDiminished(faceType === 3),
          options: {
            left: { faceType },
            right: { align: solid.data.align },
          },
        }
      }
    }
  },
  toAugGraphOpts(forme, { face }) {
    return { faceType: face.numSides }
  },
  toDimGraphOpts(forme, { cap }) {
    return { align: forme.alignment(cap) }
  },
})
