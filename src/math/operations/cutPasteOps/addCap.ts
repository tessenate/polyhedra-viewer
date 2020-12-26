import { repeat, find } from "utils"
import { Polyhedron, Face, FaceLike, Edge } from "math/polyhedra"
import { Capstone, CapType } from "specs"
import { fromSpecs } from "math/formes"
import { deduplicateVertices, alignPolyhedron, Pose } from "../operationUtils"

export type CrossAxis = (edge: Edge) => boolean

function getPose(base: FaceLike, crossAxis: CrossAxis): Pose {
  return {
    origin: base.centroid(),
    scale: base.sideLength(),
    orientation: [base, find(base.edges, crossAxis)],
  }
}

function defaultCrossAxis(edge: Edge) {
  return true
}

function defaultCapType(numSides: number) {
  return numSides <= 5 ? "pyramid" : "cupola"
}

function getCap(type: CapType, base: number) {
  return fromSpecs(
    Capstone.query.where(
      (s) =>
        s.isMono() &&
        s.isShortened() &&
        s.data.base === base &&
        type === s.capType(),
    )[0],
  )
}

// TODO make this a function on the cap forme
export function capOrientation(type: CapType): CrossAxis {
  switch (type) {
    case "pyramid":
      return () => true
    case "cupola":
      return (e) => e.face.numSides === 4
    case "rotunda":
      return (e) => e.face.numSides === 3
  }
}

/**
 * Add a cap to a polyhedron.
 * Base of the `augment` operation.
 */
export default function doAugment(
  polyhedron: Polyhedron,
  base: Face,
  baseCrossAxis: CrossAxis = defaultCrossAxis,
  capType: CapType = defaultCapType(base.numSides),
) {
  const numSides = base.numSides
  const index = ["cupola", "rotunda"].includes(capType)
    ? numSides / 2
    : numSides

  const cap = getCap(capType, index)

  const [top, bottom] = cap.endBoundaries()
  const capPose = getPose(top, capOrientation(capType))
  const basePose = getPose(base, baseCrossAxis)

  const alignedAugmentee = alignPolyhedron(
    cap.geom,
    capPose,
    basePose,
  ).withoutFaces([bottom as Face])

  const capInitial = cap.geom.withVertices(
    repeat(base.centroid(), cap.geom.numVertices()),
  )

  const endResult = polyhedron.addPolyhedron(alignedAugmentee)

  return {
    animationData: {
      start: polyhedron.addPolyhedron(capInitial),
      endVertices: endResult.vertices,
    },
    result: deduplicateVertices(endResult.withoutFaces([base])),
  }
}
