import { Vector3 } from "three"
import { Face, Edge, VertexArg } from "math/polyhedra"
import Classical, { Operation as OpName } from "specs/Classical"
import { makeOpPair } from "../operationPairs"
import { angleBetween } from "math/geom"
import { Pose } from "../operationUtils"
import { ClassicalForme } from "math/formes"
const { PI, tan } = Math

/**
 * Returns the point to sharpen given parameters in the following setup:
 *      result
 *      / ^
 *     /  |
 *   p2___f.normal
 *   /
 * p1
 *
 */
export function getSharpenPoint(face: Face, p1: Vector3, p2: Vector3) {
  const ray = face.normalRay()
  const theta1 = angleBetween(p1, p2, ray.origin)
  const dist = ray.distanceToPoint(p1) * tan(PI - theta1)
  return ray.at(dist, new Vector3())
}

export function getSharpenPointEdge(face: Face, edge: Edge) {
  return getSharpenPoint(face, edge.midpoint(), edge.twinFace().centroid())
}

interface TrioOpArgs<Op, Opts = any> {
  operation: Op
  // pose(solid: ClassicalForme, opts: Opts): Pose
  transformer(solid: ClassicalForme, opts: Opts, result: Classical): VertexArg[]
  options?(entry: Classical): Opts
}

interface TrioArgs<L, M, R> {
  left: TrioOpArgs<L>
  middle: Omit<TrioOpArgs<M>, "transformer">
  right: TrioOpArgs<R>
}

/**
 * Create a trio of truncation OpPairs: truncate, cotruncate, and rectify.
 * Given the functions to use for operations, poses, and transformers,
 * generate the triplet of OpPairs to use.
 */
export function makeTruncateTrio<
  L extends OpName,
  M extends OpName,
  R extends OpName
>(
  getPose: (forme: ClassicalForme, options: any) => Pose,
  args: TrioArgs<L, M, R>,
) {
  const { left, right, middle } = args
  function makePair(leftOp: "left" | "middle", rightOp: "middle" | "right") {
    // Choose which side is the "middle" in order to short-circuit getting the intermediate
    const middleArg =
      leftOp === "middle" ? "left" : rightOp === "middle" ? "right" : null

    return makeOpPair({
      graph: function* () {
        for (const entry of Classical.allWithOperation(middle.operation)) {
          yield {
            left: entry.withOperation(args[leftOp].operation),
            right: entry.withOperation(args[rightOp].operation),
            options: {
              left: args[leftOp].options?.(entry),
              right: args[rightOp].options?.(entry),
            },
          }
        }
      },
      // If this is the left-right operation, then the intermediate
      // is going to be the middle operation
      middle:
        middleArg ?? ((entry) => entry.left.withOperation(middle.operation)),
      getPose,
      toLeft: leftOp === "left" ? left.transformer : undefined,
      toRight: rightOp === "right" ? right.transformer : undefined,
    })
  }

  return {
    truncate: makePair("left", "middle"),
    cotruncate: makePair("middle", "right"),
    rectify: makePair("left", "right"),
  }
}
