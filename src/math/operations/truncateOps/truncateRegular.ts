import { FacetType } from "specs"
import { ClassicalForme } from "math/formes"
import { getTransformedVertices, Pose } from "../operationUtils"
import { getSharpenPointEdge, makeTruncateTrio } from "./truncateHelpers"

function getRegularPose(
  forme: ClassicalForme,
  facet: FacetType = forme.specs.facet(),
): Pose {
  return {
    origin: forme.geom.centroid(),
    scale: forme.facetFace(facet).distanceToCenter(),
    orientation: forme.adjacentFacetFaces(facet),
  }
}

/**
 * Describes the truncation operations on a Platonic solid.
 */
export default makeTruncateTrio(
  (forme, options) => getRegularPose(forme, options?.right?.facet),
  {
    left: {
      operation: "regular",
      transformer(forme) {
        return getTransformedVertices(forme.minorFacetFaces(), (face) =>
          getSharpenPointEdge(face, face.edges[0]),
        )
      },
    },
    middle: { operation: "truncate" },
    right: {
      operation: "rectify",
      // The rectified version is the only thing we need to choose an option for
      // when we move out of it
      options: (entry) => ({ facet: entry.facet() }),
      transformer(forme) {
        // All edges that between two truncated faces
        const edges = forme.geom.edges.filter((e) =>
          e.adjacentFaces().every((f) => forme.isMainFacetFace(f)),
        )
        // Move each edge to its midpoint
        return getTransformedVertices(edges, (e) => e.midpoint())
      },
    },
  },
)
