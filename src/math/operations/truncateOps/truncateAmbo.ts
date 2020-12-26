import { sum } from "lodash-es"
import { facetTypes } from "specs"
import { getTransformedVertices, Pose } from "../operationUtils"
import { ClassicalForme, fromSpecs } from "math/formes"
import { makeTruncateTrio } from "./truncateHelpers"
import { scaleMat } from "math/geom"

function avgInradius(forme: ClassicalForme) {
  return sum(facetTypes.map((f) => forme.inradius(f))) / facetTypes.length
}

function getAmboPose(forme: ClassicalForme): Pose {
  return {
    origin: forme.geom.centroid(),
    scale: avgInradius(forme),
    orientation: forme.adjacentFacetFaces("face"),
  }
}

/**
 * A trio of operations that describe the truncation behavior on a quasi-regular polyhedron
 * (tetratetrahedron, cuboctahedron, and icosidodecahedron).
 *
 * A raw truncation on one of these doesn't yield a CRF solid. We need to do some fudging
 * in order to everything to align correctly.
 *
 * We calculate the average inradius between the face-facet faces and the vertex-facet faces
 * and use that as a scale. For both, we use a reference polyhedron and calculate the vertex
 * transformations based on them.
 */
export default makeTruncateTrio(getAmboPose, {
  left: {
    operation: "rectify",
    transformer(forme, $, result) {
      const refForme = fromSpecs(result)
      const refInradius = avgInradius(refForme)
      const inradius = avgInradius(forme)
      const scale = (refForme.circumradius() / refInradius) * inradius
      // Sharpen each of the faces to a point aligning with the vertices
      // of the rectified solid
      return getTransformedVertices(forme.edgeFaces(), (f) =>
        forme.geom.centroid().clone().addScaledVector(f.normal(), scale),
      )
    },
  },
  middle: { operation: "bevel" },
  right: {
    operation: "cantellate",
    transformer(forme, $, result) {
      const refForme = fromSpecs(result)
      const edgeFace = refForme.edgeFace()
      const refMidradius = edgeFace.distanceToCenter()
      const scale = avgInradius(forme) / avgInradius(refForme)
      return getTransformedVertices(forme.edgeFaces(), (f) => {
        const translateM = f.translateNormal(
          refMidradius * scale - f.distanceToCenter(),
        )
        const scaleM = f.withCentroidOrigin(
          scaleMat((edgeFace.radius() * scale) / f.radius()),
        )
        return translateM.multiply(scaleM)
      })
    },
  },
})
