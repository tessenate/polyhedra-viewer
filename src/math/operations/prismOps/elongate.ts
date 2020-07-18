import { Twist } from "types"
import Capstone from "data/specs/Capstone"
import { Polyhedron, Cap, VertexList } from "math/polyhedra"
import { expandEdges } from "../operationUtils"
import Operation from "../Operation"
import { antiprismHeight, getScaledPrismVertices } from "./prismUtils"
import {
  elongate as _elongate,
  gyroelongPyramid,
  gyroelongCupola,
  gyroelongBipyramid,
  // gyroelongBicupola,
} from "../../operations-new/elongate"
import { toOpArgs } from "../adapters"

function doElongate(polyhedron: Polyhedron, twist?: Twist) {
  const caps = Cap.getAll(polyhedron)
  const boundary = caps[0].boundary()
  const n = boundary.numSides
  const duplicated = expandEdges(polyhedron, boundary.edges, twist)
  let vertexSets: VertexList[]

  const duplicatedCaps = Cap.getAll(duplicated)
  if (duplicatedCaps.length === 2) {
    vertexSets = duplicatedCaps
  } else {
    // Otherwise it's the largest face
    vertexSets = [
      duplicated.faces[boundary.adjacentFaces()[0].index],
      Cap.getAll(duplicated)[0],
    ]
  }
  const adjustInfo = { vertexSets, boundary }

  const height = polyhedron.edgeLength() * (twist ? antiprismHeight(n) : 1)

  const endVertices = getScaledPrismVertices(adjustInfo, height, twist)
  return {
    animationData: {
      start: duplicated,
      endVertices,
    },
  }
}

export const elongate = new Operation<{}, Capstone>(
  "elongate",
  toOpArgs("left", [_elongate]),
)

interface Options {
  twist?: Twist
}
export const gyroelongate = new Operation<Options, Capstone>("gyroelongate", {
  apply({ specs, geom }, options) {
    if (gyroelongPyramid.canApplyTo("left", specs)) {
      return gyroelongPyramid.apply("left", { specs, geom }, {})
    }
    if (gyroelongCupola.canApplyTo("left", specs)) {
      return gyroelongCupola.apply("left", { specs, geom }, {})
    }
    if (gyroelongBipyramid.canApplyTo("left", specs)) {
      return gyroelongBipyramid.apply("left", { specs, geom }, {})
    }
    // if (gyroelongBicupola.canApplyTo("left", specs)) {
    //   return gyroelongBicupola.apply("left", { specs, geom }, options)
    // }
    return doElongate(geom, options.twist)
  },

  canApplyTo(info): info is Capstone {
    if (!info.isCapstone()) return false
    // Cannot gyroelongate fastigium or triangular pyramid
    if (info.isDigonal()) return false
    if (info.isPyramid() && info.isTriangular()) return false
    return info.isShortened()
  },

  getResult({ specs }, options) {
    if (gyroelongPyramid.canApplyTo("left", specs)) {
      return gyroelongPyramid.getOpposite("left", specs, {})
    }
    if (gyroelongCupola.canApplyTo("left", specs)) {
      return gyroelongCupola.getOpposite("left", specs, {})
    }
    if (gyroelongBipyramid.canApplyTo("left", specs)) {
      return gyroelongBipyramid.getOpposite("left", specs, {})
    }
    // if (gyroelongBicupola.canApplyTo("left", specs)) {
    //   return gyroelongBicupola.getOpposite("left", specs, options)
    // }
    return specs.withData({ elongation: "antiprism" })
  },

  hasOptions(info) {
    return !info.isPyramid() && info.isBi()
  },

  *allOptionCombos() {
    yield { twist: "left" }
    yield { twist: "right" }
  },
})
