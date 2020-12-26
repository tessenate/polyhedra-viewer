import { Composite } from "specs"
import { makeCutPastePair } from "./cutPasteUtils"

export default makeCutPastePair<Composite>({
  graph: function* () {
    // Take all augmented solids with at least one augmentation
    // and pair it with its diminishing
    for (const solid of Composite.query.where(
      (s) => s.isAugmentedSolid() && s.isAugmented(),
    )) {
      yield {
        left: solid.diminish(),
        right: solid,
        options: {
          left: {
            align: solid.data.align,
            faceType: solid.augmentFaceType(),
          },
          right: {},
        },
      }
    }
  },
  toAugGraphOpts(forme, { face }) {
    return { align: forme.alignment(face), faceType: face.numSides }
  },
  baseAxis({ specs }) {
    const { source } = specs.data
    // Make sure that augmented truncated polyhedra align
    // the square cupola face to a triangular face
    if (source.isClassical() && source.isTruncated()) {
      return (edge) => edge.twinFace().numSides === 3
    }
  },
})
