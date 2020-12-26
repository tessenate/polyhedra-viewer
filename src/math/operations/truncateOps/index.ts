import { oppositeFacet } from "specs"
import { combineOps } from "../operationPairs"
import Operation, { OpArgs } from "../Operation"
import { FacetOpts } from "../operationUtils"
import { Classical, Composite } from "specs"
import regs from "./truncateRegular"
import ambos from "./truncateAmbo"
import augTruncate from "./truncateAugmented"

export const truncate = new Operation(
  "truncate",
  combineOps<Classical | Composite, any>([
    regs.truncate.left,
    ambos.truncate.left,
    augTruncate.left,
  ]),
)

export const cotruncate = new Operation(
  "cotruncate",
  combineOps([regs.cotruncate.left, ambos.cotruncate.left]),
)

export const rectify = new Operation(
  "rectify",
  combineOps([regs.rectify.left, ambos.rectify.left]),
)

const hitOptArgs: Partial<OpArgs<FacetOpts, Classical>> = {
  hitOption: "facet",
  getHitOption(forme, hitPoint) {
    const face = forme.geom.hitFace(hitPoint)
    const facet = forme.getFacet(face)
    return facet ? { facet: oppositeFacet(facet) } : {}
  },

  selectionState(face, forme, { facet }) {
    if (facet && forme.isFacetFace(face, oppositeFacet(facet)))
      return "selected"
    return "selectable"
  },
}

export const sharpen = new Operation("sharpen", {
  ...combineOps<Classical | Composite, Partial<FacetOpts>>([
    regs.truncate.right,
    ambos.truncate.right,
    augTruncate.right,
    regs.rectify.right,
    ambos.rectify.right,
  ]),
  // TODO split up sharpening rectified and sharpening truncated
  ...hitOptArgs,
})

// TODO the following operators are unused right now
// and need to be integrated into the app

// TODO why doesn't the typing work here?
export const cosharpen = new Operation("cosharpen", {
  ...combineOps<Classical, any>([
    regs.cotruncate.right,
    ambos.cotruncate.right,
  ]),
  ...hitOptArgs,
})

export const unrectify = new Operation("unrectify", {
  ...combineOps<Classical, any>([regs.rectify.right, ambos.rectify.right]),
  ...hitOptArgs,
})
