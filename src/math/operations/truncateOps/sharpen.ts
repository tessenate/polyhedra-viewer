import Classical from "data/specs/Classical"
import Operation from "../Operation"
import {
  truncate as metaTruncate,
  rectify as metaRectify,
} from "../../operations-new/truncate"

interface Options {
  facet?: "vertex" | "face"
}

export const sharpen = new Operation<Options, Classical>("sharpen", {
  apply(solid, options) {
    if (solid.specs.isRectified()) {
      return metaRectify.applyRight(solid, options)
    }
    return metaTruncate.applyRight(solid, {})
  },

  canApplyTo(info): info is Classical {
    if (metaTruncate.canApplyRightTo(info)) return true
    if (metaRectify.canApplyRightTo(info)) return true
    return false
  },

  getResult({ specs }, options) {
    if (specs.isRectified()) {
      // if rectified, we have to figure out the facet from the faceType
      return metaRectify.getLeft(specs, options)
    } else {
      return metaTruncate.getLeft(specs)
    }
  },

  hasOptions(info) {
    if (metaTruncate.canApplyRightTo(info)) return false
    return !info.isTetrahedral() && info.isRectified()
  },

  *allOptionCombos({ specs }) {
    if (metaTruncate.canApplyRightTo(specs)) {
      yield {}
    } else if (specs.isRectified() && !specs.isTetrahedral()) {
      yield { facet: "face" }
      yield { facet: "vertex" }
    } else {
      yield {}
    }
  },

  hitOption: "facet",
  getHitOption({ geom }, hitPoint) {
    const n = geom.hitFace(hitPoint).numSides
    return n <= 5 ? { facet: n === 3 ? "face" : "vertex" } : {}
  },

  faceSelectionStates({ specs, geom }, { facet }) {
    const faceType = !facet ? null : facet === "face" ? 3 : specs.data.family
    return geom.faces.map((face) => {
      if (face.numSides === faceType) return "selected"
      return "selectable"
    })
  },
})
