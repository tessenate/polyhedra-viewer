import { minBy } from "lodash-es"

import { flatMapUniq } from "utils"
import { Polyhedron, Face } from "math/polyhedra"
import { PRECISION, getPlane, withOrigin } from "math/geom"
import { getTransformedVertices } from "../operations/operationUtils"

export function getResizedVertices(
  faces: Face[],
  resizedLength: number,
  angle: number = 0,
) {
  // Update the vertices with the expanded-out version.
  const f0 = faces[0]
  const scale = resizedLength - f0.distanceToCenter()
  return getTransformedVertices(faces, (f) =>
    withOrigin(f.centroid(), (v) =>
      v.getRotatedAroundAxis(f.normal(), angle).add(f.normal().scale(scale)),
    ),
  )
}

type ExpansionType = "cantellate" | "snub"

function expansionType(polyhedron: Polyhedron): ExpansionType {
  return polyhedron.getVertex().adjacentFaceCounts()[3] >= 3
    ? "snub"
    : "cantellate"
}

const edgeShape = {
  snub: 3,
  cantellate: 4,
}

export function isExpandedFace(
  polyhedron: Polyhedron,
  face: Face,
  nSides?: number,
) {
  const type = expansionType(polyhedron)
  if (typeof nSides === "number" && face.numSides !== nSides) return false
  if (!face.isValid()) return false
  return face.adjacentFaces().every((f) => f.numSides === edgeShape[type])
}

function getFaceDistance(face1: Face, face2: Face) {
  let dist = 0
  let current = [face1]
  while (!face2.inSet(current)) {
    dist++
    current = flatMapUniq(current, (face) => face.adjacentFaces(), "index")

    if (dist > 10) {
      throw new Error("we went toooooo far")
    }
  }
  return dist
}

function getIcosahedronContractFaces(polyhedron: Polyhedron) {
  const result = []
  let toTest = polyhedron.faces
  while (toTest.length > 0) {
    const [next, ...rest] = toTest
    result.push(next)
    toTest = rest.filter((face) => getFaceDistance(face, next) === 3)
  }
  return result
}

function getCuboctahedronContractFaces(polyhedron: Polyhedron) {
  const f0 = polyhedron.faceWithNumSides(3)
  const rest = f0.edges.map((e) => e.twin().next().next().twinFace())
  return [f0, ...rest]
}

function getTruncatedOctahedronContractFaces(polyhedron: Polyhedron) {
  const f0 = polyhedron.faceWithNumSides(6)
  const rest = f0.edges
    .filter((e) => e.twinFace().numSides === 4)
    .map((e) => e.twin().next().next().twinFace())
  return [f0, ...rest]
}

// FIXME split this up into multiple functions for the different operations
export function getExpandedFaces(polyhedron: Polyhedron, faceType?: number) {
  switch (polyhedron.name) {
    case "cuboctahedron":
      return getCuboctahedronContractFaces(polyhedron)
    case "icosahedron":
      return getIcosahedronContractFaces(polyhedron)
    case "truncated octahedron":
      return getTruncatedOctahedronContractFaces(polyhedron)
    case "truncated icosidodecahedron":
    case "truncated cuboctahedron":
      return polyhedron.faces.filter((f) => f.numSides === faceType)
    default:
      return polyhedron.faces.filter((face) =>
        isExpandedFace(polyhedron, face, faceType),
      )
  }
}

/**
 * Return the snub angle of the given polyhedron, given the list of expanded faces
 */
export function getSnubAngle(polyhedron: Polyhedron, expandedFaces: Face[]) {
  // Choose one of the expanded faces and get its properties
  const [face0, ...rest] = expandedFaces
  const faceCentroid = face0.centroid()
  const faceNormal = face0.normal()
  const midpoint = face0.edges[0].midpoint()

  // Choose one of the closest faces
  const face1 = minBy(rest, (face) => midpoint.distanceTo(face.centroid()))!

  const plane = getPlane([
    faceCentroid,
    face1.centroid(),
    polyhedron.centroid(),
  ])

  const normMidpoint = midpoint.sub(faceCentroid)
  const projected = plane.getProjectedPoint(midpoint).sub(faceCentroid)
  // Use `||` and not `??` because this can return NaN
  const angle = normMidpoint.angleBetween(projected, true) || 0
  // Return a positive angle if it's a ccw turn, a negative angle otherwise
  const sign = normMidpoint
    .cross(projected)
    .getNormalized()
    .equalsWithTolerance(faceNormal, PRECISION)
    ? -1
    : 1
  return angle * sign
}
