import { Classical, oppositeFacet, FacetType } from "specs"
import { makeOpPair } from "../operationPairs"
import { Pose, getTransformedVertices } from "../operationUtils"
import { ClassicalForme, fromSpecs } from "math/formes"

function getPose(forme: ClassicalForme, facet: FacetType, scale: number): Pose {
  const { geom } = forme
  return {
    // Always centered on centroid
    origin: geom.centroid(),
    // Use the normal of the given face as the first axis
    scale,
    orientation: forme.adjacentFacetFaces(facet),
  }
}

function getCantellatedMidradius(forme: ClassicalForme) {
  return forme.edgeFace().distanceToCenter()
}

/**
 * Take the cantellated intermediate solid and convert it to either dual
 */
function doDualTransform(forme: ClassicalForme, result: Classical) {
  const resultForme = fromSpecs(result)
  const resultSideLength =
    getCantellatedMidradius(forme) / resultForme.midradius()
  const scale = resultSideLength * resultForme.circumradius()
  const faces = forme.facetFaces(oppositeFacet(result.facet()))
  return getTransformedVertices(faces, (f) => {
    return forme.geom.centroid().clone().addScaledVector(f.normal(), scale)
  })
}

export default makeOpPair<Classical>({
  graph: function* () {
    for (const specs of Classical.query.where(
      (s) => s.isRegular() && !s.isVertex(),
    )) {
      yield { left: specs, right: specs.withData({ facet: "vertex" }) }
    }
  },
  middle: (entry) => entry.left.withOperation("cantellate"),
  getPose(forme) {
    const { geom } = forme
    if (forme.specs.isCantellated()) {
      return getPose(forme, "face", getCantellatedMidradius(forme))
    }
    if (forme.specs.isFace()) {
      return getPose(forme, "face", forme.midradius())
    }
    // for the vertex figure, pick a vertex and align it with that edge
    const vertex = geom.getVertex()
    return {
      origin: geom.centroid(),
      scale: forme.midradius(),
      orientation: [vertex, vertex.adjacentVertices()[0]],
    }
  },
  toLeft: (forme, _, result) => doDualTransform(forme, result),
  toRight: (forme, _, result) => doDualTransform(forme, result),
})
