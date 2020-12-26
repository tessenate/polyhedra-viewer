import { takeRight, dropRight, invert, isEmpty, uniq } from "lodash-es"
import { Vector3, Matrix4 } from "three"
import {
  Polyhedron,
  Facet,
  Edge,
  Vertex,
  VertexList,
  VertexArg,
} from "math/polyhedra"
import { Transform, translateMat, scaleMat } from "math/geom"
import { mapObject } from "utils"
import { PolyhedronSpecs, FacetType, Twist } from "specs"

export interface FacetOpts {
  facet: FacetType
}

export interface TwistOpts {
  twist: Twist
}

/**
 * Get the face opposite of the given edge, using the given "twist" option
 */
export function oppositeFace(edge: Edge, twist?: Twist) {
  switch (twist) {
    case "left":
      return edge.twin().next().twin().prev().twinFace()
    case "right":
      return edge.twin().prev().twin().next().twinFace()
    default:
      // If no twist is provided, assume a square
      return edge.twin().next().next().twinFace()
  }
}

export type Axis = Vector3 | Facet

/**
 * Defines an orthonormal orientation.
 * An orientation [u, v] defineds the basis [u, v, u x v]
 */
export type Orientation = readonly [Axis, Axis]

/**
 * Defines a scale, origin, and orientation used to transform one polyhedron to another.
 */
export interface Pose {
  scale: number
  origin: Vector3
  orientation: Orientation
}

function normalizeAxis(u: Axis) {
  return u instanceof Facet ? u.normal() : u
}

function normalizeOrientation([u1, u2]: Orientation): [Vector3, Vector3] {
  const _u1 = normalizeAxis(u1).clone().normalize()
  const _u2 = normalizeAxis(u2).clone().projectOnPlane(_u1).normalize()
  return [_u1, _u2]
}

function getTransform({ origin, scale, orientation }: Pose) {
  const [u1, u2] = normalizeOrientation(orientation)
  const translateM = translateMat(origin)
  const scaleM = scaleMat(scale)
  const rotationM = new Matrix4().makeBasis(u1, u2, u1.clone().cross(u2))
  return rotationM.premultiply(scaleM).premultiply(translateM)
}

// Translate, rotate, and scale the polyhedron with the transformation given by the two poses
export function alignPolyhedron(
  solid: Polyhedron,
  oldPose: Pose,
  newPose: Pose,
) {
  const oldMat = getTransform(oldPose)
  const newMat = getTransform(newPose)
  const oldMatInv = oldMat.getInverse(oldMat)
  // Un-apply the original pose, then apply the new pose
  const newVertices = solid.vertices.map((v) =>
    v.vec.clone().applyMatrix4(oldMatInv).applyMatrix4(newMat),
  )
  return solid.withVertices(newVertices)
}

/**
 * Return the Polyhedron geometry matching the given specs
 */
export function getGeometry(specs: PolyhedronSpecs) {
  const geom = Polyhedron.get(specs.canonicalName())
  // The reference models are always right-handed,
  // so flip 'em if not
  // TODO don't rely on this and make it more general
  if (specs.isClassical() && specs.isSnub() && specs.data.twist === "left") {
    return geom.reflect()
  }

  if (specs.isCapstone() && specs.isChiral()) {
    if (specs.isCupolaRotunda() && specs.data.twist === "left") {
      return geom.reflect()
    } else if (!specs.isCupolaRotunda() && specs.data.twist === "right") {
      return geom.reflect()
    }
  }
  return geom
}

/**
 * Remove vertices in the polyhedron that aren't connected to any faces,
 * and remap the faces to the smaller indices
 */
export function removeExtraneousVertices(polyhedron: Polyhedron) {
  // Vertex indices to remove
  const vertsInFaces = polyhedron.faces.flatMap((f) => f.vertices)
  const toRemove = polyhedron.vertices.filter((v) => !v.inSet(vertsInFaces))
  const numToRemove = toRemove.length

  // Map the `numToRemove` last vertices of the polyhedron (that don't overlap)
  // to the first few removed vertices
  const notToRemove = takeRight(polyhedron.vertices, numToRemove).filter(
    (v) => !v.inSet(toRemove),
  )
  const newToOld = mapObject(notToRemove, (v, i) => [
    v.index,
    toRemove[i].index,
  ])
  const oldToNew = invert(newToOld)

  const newVertices = dropRight(
    polyhedron.vertices.map(
      (v) => polyhedron.vertices[(oldToNew[v.index] as any) ?? v.index],
    ),
    numToRemove,
  )

  return polyhedron.withChanges((solid) =>
    solid
      .withVertices(newVertices)
      .mapFaces((face) =>
        face.vertices.map((v) => newToOld[v.index] ?? v.index),
      ),
  )
}

/** Remove vertices (and faces) from the polyhedron when they are all the same */
export function deduplicateVertices(polyhedron: Polyhedron) {
  // group vertex indices by same
  const unique: Vertex[] = []
  const oldToNew: Record<number, number> = {}

  polyhedron.vertices.forEach((v, vIndex) => {
    const match = unique.find((point) => v.isConcentric(point))
    if (match === undefined) {
      unique.push(v)
      oldToNew[vIndex] = vIndex
    } else {
      oldToNew[vIndex] = match.index
    }
  })

  if (isEmpty(oldToNew)) return polyhedron

  // replace vertices that are the same
  const newFaces = polyhedron.faces
    .map((face) => uniq(face.vertices.map((v) => oldToNew[v.index])))
    .filter((vIndices) => vIndices.length >= 3)

  // remove extraneous vertices
  return removeExtraneousVertices(polyhedron.withFaces(newFaces))
}

function normalizeTransform(t: Transform | Vector3 | Matrix4): Transform {
  if (t instanceof Matrix4) {
    return (v) => v.clone().applyMatrix4(t)
  }
  if (t instanceof Vector3) {
    return () => t
  }
  return t
}

/**
 * Apply a transformation per vertex list. This function allows transformations like
 * "blow up these faces away from a center point" or "expand these faces out radially".
 *
 * @param vLists The list of `VertexList`s to apply transformations to
 * @param iteratee the function to apply on each `VertexList` to generate a transform.
 * The function can either return a transform or a single vector value.
 * @param vertices The list of vertices to transform and return.
 * This defaults to the vertices of the polyhedron attached to the first `VertexList`.
 */
export function getTransformedVertices<T extends VertexList>(
  vLists: readonly T[],
  iteratee: (key: T) => Vector3 | Matrix4,
  vertices: Vertex[] = vLists[0].polyhedron.vertices,
) {
  const result: VertexArg[] = [...vertices]
  for (const vList of vLists) {
    for (const v of vList.vertices) {
      const t = normalizeTransform(iteratee(vList))
      result[v.index] = t(v.vec)
    }
  }
  return result
}
