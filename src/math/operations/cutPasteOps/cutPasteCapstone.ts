import { Capstone } from "specs"
import { makeCutPastePair } from "./cutPasteUtils"
import { capOrientation } from "./addCap"

export default makeCutPastePair<Capstone>({
  graph: function* () {
    // Take every capstone solid that has at least one cap,
    // and ignore pure capstones
    for (const cap of Capstone.query.where(
      (s) => !s.isSnub() && !s.isPrismatic() && (s.isBi() || !s.isShortened()),
    )) {
      // Some capstones can be modified with rotunda
      for (const capType of cap.capTypes()) {
        yield {
          left: cap.remove(capType),
          right: cap,
          options: {
            left: {
              gyrate: cap.data.gyrate,
              using: capType,
              faceType: cap.baseSides(),
            },
            right: { using: capType },
          },
        }
      }
    }
  },
  toAugGraphOpts($, { face, ...opts }) {
    return { ...opts, faceType: face.numSides }
  },
  toDimGraphOpts(forme, { cap }) {
    if (!forme.specs.isCupolaRotunda()) return {}
    // Determine the cap type for cupolarotundae
    return { using: cap.type }
  },
  baseAxis(forme, { gyrate }) {
    const { specs } = forme
    // TODO gyroelongated bi solids need to pick an orientation for the right twist
    if (specs.isPrismatic() || specs.isPrimary() || specs.isGyroelongated()) {
      return
    }
    const orientationFn = capOrientation(forme.endCaps()[0].type)
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
