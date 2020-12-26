import { Matrix4, Vector3, Plane, Ray } from "three"

export const PRECISION_DIGITS = 3
export const PRECISION = 10 ** -PRECISION_DIGITS

export function vecEquals(v1: Vector3, v2: Vector3) {
  return v1.distanceTo(v2) < PRECISION
}

export const getMidpoint = (v1: Vector3, v2: Vector3) =>
  new Vector3().addVectors(v1, v2).divideScalar(2)

export function angleBetween(o: Vector3, a: Vector3, b: Vector3) {
  // colinear points return NaN, so return 0 instead
  return a.clone().sub(o).angleTo(b.clone().sub(o))
}

// Get the plane containing the given points
export function getPlane(points: Vector3[]) {
  if (points.length < 3) {
    throw new Error("Need at least three points for a plane")
  }
  return new Plane().setFromCoplanarPoints(points[0], points[1], points[2])
}

// Return whether the set of points lie on a plane
export function isPlanar(points: Vector3[]) {
  const plane = getPlane(points)
  return points.every((vec) => Math.abs(plane.distanceToPoint(vec)) < PRECISION)
}

export function getCentroid(vectors: Vector3[]) {
  return vectors
    .reduce((v1, v2) => v1.add(v2), new Vector3())
    .divideScalar(vectors.length)
}

// Get the normal of a polygon given its ordered vertices
export function getNormal(vertices: Vector3[]) {
  const [v0, v1, v2] = vertices
  return v0.clone().sub(v1).cross(v1.clone().sub(v2)).normalize()
}

export function getNormalRay(vertices: Vector3[]) {
  return new Ray(getCentroid(vertices), getNormal(vertices))
}

export type Transform = (v: Vector3) => Vector3

export function translateMat(v: Vector3) {
  return new Matrix4().makeTranslation(v.x, v.y, v.z)
}

export function scaleMat(s: number) {
  return new Matrix4().makeScale(s, s, s)
}

export function withOrigin(o: Vector3, m: Matrix4): Matrix4 {
  const mat = translateMat(o)
  const matInv = new Matrix4().getInverse(mat)
  return matInv.premultiply(m).premultiply(mat)
}
