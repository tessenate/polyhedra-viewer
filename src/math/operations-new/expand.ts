import { Twist } from "types"
import Classical from "data/specs/Classical"
import OperationPair, { Pose } from "./OperationPair"
import { Polyhedron } from "math/polyhedra"
import {
  getResizedVertices,
  getExpandedFaces,
  getSnubAngle,
} from "../operations/resizeOps/resizeUtils"

interface Options {
  faceType?: 3 | 4 | 5
}

const coxeterNum = { 3: 4, 4: 6, 5: 10 }

function getContractLength(
  family: 3 | 4 | 5,
  polyhedron: Polyhedron,
  faceType: 3 | 4 | 5,
) {
  // Calculate dihedral angle
  // https://en.wikipedia.org/wiki/Platonic_solid#Angles
  const n = family
  const s = polyhedron.edgeLength()
  const p = faceType
  const q = 3 + n - p
  const h = coxeterNum[n]
  const tanTheta2 = Math.cos(Math.PI / q) / Math.sin(Math.PI / h)

  // Calculate the inradius
  // https://en.wikipedia.org/wiki/Platonic_solid#Radii,_area,_and_volume
  return (s / 2 / Math.tan(Math.PI / p)) * tanTheta2
}

// Get the pose of a regular solid for both expand/snub
function getRegularPose(geom: Polyhedron): Pose {
  const face = geom.getFace()
  const crossAxis = face.edges[0].midpoint().sub(face.centroid())
  return {
    origin: geom.centroid(),
    scale: face.sideLength(),
    orientation: [face.normal(), crossAxis],
  }
}

export const expand = new OperationPair<Classical, Options>({
  graph: Classical.query
    .where((data) => data.operation === "regular")
    .map((entry) => {
      return {
        source: entry,
        target: entry.withData({ operation: "cantellate" }),
        options: { faceType: entry.isFace() ? entry.data.family : 3 },
      }
    }),
  getIntermediate({ target }) {
    return { specs: target, geom: Polyhedron.get(target.canonicalName()) }
  },
  getPose({ geom, specs }, { faceType }) {
    const origin = geom.centroid()
    if (specs.isRegular()) {
      return getRegularPose(geom)
    }
    if (specs.isCantellated()) {
      // depends on the face type given in options
      const face = geom.faces.find(
        (face) =>
          face.numSides === faceType &&
          face.adjacentFaces().every((f) => f.numSides === 4),
      )!
      const crossAxis = face.edges[0].midpoint().sub(face.centroid())
      return {
        origin,
        scale: face.sideLength(),
        orientation: [face.normal(), crossAxis],
      }
    }
    // FIXME handle expanding truncated solids
    throw new Error(`Cannot find pose`)
  },
  toStart({ specs, geom }, { faceType = 3 }) {
    // const resultLength = info.isBevelled()
    //   ? getContractLengthSemi(polyhedron, faceType, result)
    //   : getContractLength(info.data.family, polyhedron, faceType)

    const resultLength = getContractLength(specs.data.family, geom, faceType)

    // Take all the stuff and push it inwards
    const contractFaces = getExpandedFaces(geom, faceType)

    // const angle = specs.isBevelled() ? 0 : -getSnubAngle(polyhedron, contractFaces)
    const angle = 0

    return getResizedVertices(contractFaces, resultLength, angle)
  },
  toEnd({ geom }) {
    return geom.vertices
  },
})

interface SnubOptions {
  twist?: Twist
}

function getOpp(twist: Twist) {
  return twist === "left" ? "right" : "left"
}

export const snub = new OperationPair<Classical, SnubOptions>({
  graph: Classical.query
    .where((data) => data.operation === "regular")
    .flatMap((entry) => {
      // Snub tetrahedra aren't chiral (yet)
      const options: Twist[] = entry.isTetrahedral()
        ? ["left"]
        : ["left", "right"]
      return options.map((twist) => ({
        source: entry,
        target: entry.withData({
          operation: "snub",
          // If a vertex-solid, the chirality of the result
          // is *opposite* of the twist option
          twist: entry.isVertex() ? getOpp(twist) : twist,
        }),
        options: { twist },
      }))
    }),
  getIntermediate({ target }) {
    // the refs are always right twisted so flip it
    // if the target is supposed to be left
    // TODO don't rely on the models and calculate this yourself
    let geom = Polyhedron.get(target.canonicalName())
    if (target.data.twist === "left") {
      geom = geom.reflect()
    }

    return {
      specs: target,
      // get the reference with the proper chirality
      geom,
    }
  },
  getPose({ geom, specs }, { twist }) {
    const origin = geom.centroid()
    if (specs.isRegular()) {
      return getRegularPose(geom)
    }
    if (specs.isSnub()) {
      // If the twist option is in the same direction as the spec,
      // it's a face-solid. Otherwise it's a vertex solid
      // FIXME doens'doesn't work for vertex figures
      const faceType = specs.data.twist === twist ? specs.data.family : 3
      // depends on the face type given in options
      const face = geom.faces.find(
        (face) =>
          face.numSides === faceType &&
          face.adjacentFaces().every((f) => f.numSides === 3),
      )!
      const faces = getExpandedFaces(geom, faceType)
      const snubAngle = getSnubAngle(geom, faces)
      const crossAxis = face.edges[0].midpoint().sub(face.centroid())
      return {
        origin,
        scale: face.sideLength(),
        orientation: [
          face.normal(),
          crossAxis.getRotatedAroundAxis(face.normal(), -snubAngle),
        ],
      }
    }
    // FIXME handle expanding truncated solids
    throw new Error(`Cannot find pose`)
  },
  toStart({ specs, geom }, { twist = "left" }) {
    const faceType = twist === specs.data.twist ? specs.data.family : 3
    const resultLength = getContractLength(specs.data.family, geom, faceType)
    // Take all the stuff and push it inwards
    const contractFaces = getExpandedFaces(geom, faceType)
    const angle = -getSnubAngle(geom, contractFaces)
    return getResizedVertices(contractFaces, resultLength, angle)
  },
  toEnd({ geom }) {
    return geom.vertices
  },
})