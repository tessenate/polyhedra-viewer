import { Capstone } from "specs"
import { makeOpPair } from "../operationPairs"
import { Pose, getTransformedVertices, FacetOpts } from "../operationUtils"
import { CapstoneForme } from "math/formes"

function getCapstoneCrossAxis(forme: CapstoneForme) {
  const topBoundary = forme.endBoundaries()[0]
  // for the bicupolae, find an edge connected to a square cupola face
  if (forme.specs.isSecondary()) {
    return topBoundary.edges.find((e) => e.face.numSides === 4)!
  }
  // For prisms, it can be any edge
  if (forme.specs.isPrismatic()) {
    return topBoundary.edges[0]
  }
  // For bipyramids, it's vertex-centered
  return topBoundary.vertices[0]
}

function getPose(forme: CapstoneForme): Pose {
  const top = forme.ends()[0]
  const crossAxis = getCapstoneCrossAxis(forme)
  return {
    origin: forme.centroid(),
    scale: forme.geom.edgeLength(),
    orientation: [top, crossAxis],
  }
}

function getApothem(s: number, n: number) {
  return s / 2 / Math.tan(Math.PI / n)
}

function contractToPrism(forme: CapstoneForme) {
  return getTransformedVertices(forme.facetFaces("face"), (face) => {
    if (forme.isTop(face)) {
      // Push the tops down so that they are aligned with the prismatic height
      return face.translateNormal(
        forme.prismaticHeight() / 2 - face.distanceToCenter(),
      )
    } else {
      // Push the side faces in to the apothem length of the bipyramid
      const apothem = getApothem(face.sideLength(), forme.specs.data.base)
      return face.translateNormal(apothem - face.distanceToCenter())
    }
  })
}

function contractToBipyramid(forme: CapstoneForme) {
  return getTransformedVertices(forme.facetFaces("vertex"), (face) => {
    // The pyramid faces need to be pushed *down* and *in*
    // so find relative side and top faces as reference
    const sideFace = face.adjacentFaces().find((f) => forme.isSideFace(f))!
    const apothem = getApothem(face.sideLength(), forme.specs.data.base)
    const horiz = sideFace.translateNormal(
      apothem - sideFace.distanceToCenter(),
    )
    const topFace = face.vertices
      .flatMap((v) => v.adjacentFaces())
      .find((f) => forme.isTop(f))!
    const vert = topFace.translateNormal(-forme.prismaticHeight() / 2)
    return horiz.multiply(vert)
  })
}

function* elongatedOrthobicupolae() {
  for (const specs of Capstone.query.where(
    (cap) => cap.isCupola() && cap.isBi() && cap.isElongated() && cap.isOrtho(),
  )) {
    yield specs
  }
}

export const expand = makeOpPair<Capstone, {}, FacetOpts>({
  graph: function* () {
    for (const specs of elongatedOrthobicupolae()) {
      yield {
        left: specs.withData({ count: 0, type: "primary" }),
        right: specs,
        options: {
          left: {},
          right: { facet: "face" },
        },
      }
      yield {
        left: specs.withData({ elongation: "none", type: "primary" }),
        right: specs,
        options: {
          left: {},
          right: { facet: "vertex" },
        },
      }
    }
  },
  middle: "right",
  getPose,
  toLeft(forme, { right: { facet } }) {
    return facet === "face"
      ? contractToPrism(forme)
      : contractToBipyramid(forme)
  },
})

export const dual = makeOpPair<Capstone>({
  graph: function* () {
    for (const specs of elongatedOrthobicupolae()) {
      yield {
        left: specs.withData({ count: 0, type: "primary" }),
        right: specs.withData({ elongation: "none", type: "primary" }),
      }
    }
  },
  middle: (entry) =>
    entry.right.withData({
      elongation: "prism",
      type: "secondary",
      gyrate: "ortho",
    }),
  getPose,
  toLeft: contractToPrism,
  toRight: contractToBipyramid,
})
