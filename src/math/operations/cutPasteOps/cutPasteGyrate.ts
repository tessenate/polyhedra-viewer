import { Composite, gyrations } from "specs"
import { makeCutPastePair } from "./cutPasteUtils"

export default makeCutPastePair<Composite>({
  graph: function* () {
    for (const solid of Composite.query.where(
      (s) => s.isGyrateSolid() && s.isDiminished(),
    )) {
      // Each solid can be gyro-augmented or ortho-augmented
      for (const gyrate of gyrations) {
        yield {
          left: solid,
          right: solid.augmentGyrate(gyrate),
          options: {
            left: { gyrate },
            right: { gyrate, align: solid.data.align },
          },
        }
      }
    }
  },
  toAugGraphOpts($, { face, ...opts }) {
    return { gyrate: opts.gyrate }
  },
  toDimGraphOpts(forme, { cap }) {
    if (forme.isGyrate(cap)) {
      return { gyrate: "ortho" }
    } else {
      return { gyrate: "gyro", align: forme.alignment(cap) }
    }
  },
  baseAxis(forme, { gyrate }) {
    const { family } = forme.specs.sourceClassical().data
    // If ortho, line the square face of the cupola with a square face here
    return (edge) =>
      edge.twinFace().numSides === (gyrate === "ortho" ? 4 : family)
  },
})
