import { Capstone } from "data/specs"
import CapstoneForme from "math/formes/CapstoneForme"
import { makeCutPastePair } from "./cutPasteUtils"
import { capOrientation } from "./addCap"

export default makeCutPastePair<CapstoneForme>({
  graph: function* () {
    // Take every capstone solid that has at least one cap,
    // and ignore pure capstones
    for (const cap of Capstone.query.where(
      (s) => !s.isPrismatic() && (s.isBi() || !s.isShortened()),
    )) {
      // Some capstones can be modified with rotunda
      for (const capType of cap.capTypes()) {
        yield {
          left: cap.remove(capType),
          right: cap,
          options: {
            left: { gyrate: cap.data.gyrate, using: capType },
            right: { using: capType },
          },
        }
      }
    }
  },
  toAugGraphOpts($, { face, ...opts }) {
    return opts
  },
  toDimGraphOpts(forme, { cap }) {
    if (!forme.specs.isCupolaRotunda()) return {}
    // Determine the cap type for cupolarotundae
    return { using: cap.type as any }
  },
  baseAxis(forme, { gyrate }) {
    const { specs } = forme
    // TODO gyroelongated bi solids need to pick an orientation for the right twist
    if (specs.isPrismatic() || specs.isPrimary() || specs.isGyroelongated()) {
      return
    }
    // FIXME this might fail with the digonal cupola?
    const orientationFn = capOrientation(forme.baseCaps()[0].type as any)
    return (edge) => {
      // Determine the cupola face to check
      edge = edge.twin()
      // If elongated, pick the edge belonging to the opposite face
      if (!specs.isShortened()) edge = edge.next().next().twin()
      // Line the square faces if ortho, but not if gyro
      return gyrate === "ortho" ? orientationFn(edge) : !orientationFn(edge)
    }
  },
})
