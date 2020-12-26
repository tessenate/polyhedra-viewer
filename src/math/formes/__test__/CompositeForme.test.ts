import { find } from "utils"
import CompositeForme from "../CompositeForme"
import { Face } from "math/polyhedra"

describe("CompositeForme", () => {
  describe("canAugment", () => {
    it("returns true for all faces of tetrahedron", () => {
      const forme = CompositeForme.fromName("tetrahedron")
      const faces = forme.geom.faces
      function canAugment(face: Face) {
        return forme.canAugment(face)
      }
      expect(faces).toSatisfyAll(canAugment)
    })

    it("returns true for side faces of triangular pyramid", () => {
      const forme = CompositeForme.fromName("triangular prism")
      const faces = forme.geom.facesWithNumSides(4)
      function canAugment(face: Face) {
        return forme.canAugment(face)
      }
      expect(faces).toSatisfyAll(canAugment)
    })

    it("return true for square faces of augmented triangular pyramid", () => {
      const forme = CompositeForme.fromName("augmented triangular prism")
      const faces = forme.geom.facesWithNumSides(4)
      function canAugment(face: Face) {
        return forme.canAugment(face)
      }
      expect(faces).toSatisfyAll(canAugment)
    })
  })

  describe("getFacet", () => {
    describe("rhombitetratetrahedra", () => {
      it("works for gyrate", () => {
        const forme = CompositeForme.fromName("gyrate rhombitetratetrahedron")
        const facets = forme.geom.faces.map((face) => forme.getFacet(face))

        // make sure there are an equal number of face and facet vertices
        expect(facets.filter((f) => f === "face")).toHaveLength(4)
        expect(facets.filter((f) => f === "vertex")).toHaveLength(4)

        // Make sure there are 3-1 ratios on the gyrated cap and the source face
        // make sure the face facet is the center of the gyrate cap
        const gyrateFaceFacet = find(
          forme.geom.faces,
          (face) => forme.isGyrateFace(face) && forme.isFacetFace(face, "face"),
        )
        const gyrateAdjFaces = gyrateFaceFacet.vertexAdjacentFaces()
        expect(
          gyrateAdjFaces.filter((face) => forme.isFacetFace(face, "vertex")),
        ).toHaveLength(3)

        // make sure the vertex facet is an inner face in the source
        const sourceVertexFacet = find(
          forme.geom.faces,
          (face) =>
            !forme.isGyrateFace(face) && forme.isFacetFace(face, "vertex"),
        )
        const sourceAdjFaces = sourceVertexFacet.vertexAdjacentFaces()
        expect(
          sourceAdjFaces.filter((face) => forme.isFacetFace(face, "face")),
        ).toHaveLength(3)
      })

      it("works for diminished", () => {
        const forme = CompositeForme.fromName(
          "diminished rhombitetratetrahedron",
        )
        const facets = forme.geom.faces.map((face) => forme.getFacet(face))

        // check there are three face facets, one vertex facet
        expect(facets.filter((f) => f === "face")).toHaveLength(3)
        expect(facets.filter((f) => f === "vertex")).toHaveLength(1)

        // make sure the vertex facet is surrounded by the others
        const vertexFacet = find(forme.geom.faces, (face) =>
          forme.isFacetFace(face, "vertex"),
        )
        const adjFaces = vertexFacet.vertexAdjacentFaces()
        expect(
          adjFaces.filter((face) => forme.isFacetFace(face, "face")),
        ).toHaveLength(3)
      })
    })

    xdescribe("cuboctahedron", () => {
      it("works with gyrate", () => {
        const forme = CompositeForme.fromName("gyrate cuboctahedron")

        // Assert the right number of face and edge facets
        const faceFacets = forme.geom.faces.filter((f) =>
          forme.isFacetFace(f, "face"),
        )
        expect(faceFacets).toHaveLength(8)

        const edgeFaces = forme.geom.faces.filter((f) => forme.isEdgeFace(f))
        expect(edgeFaces).toHaveLength(12)

        // Make sure the gyrated faces are aligned correctly
        const triangFaces = forme.geom.faces.filter(
          (f) => forme.isGyrateFace(f) && f.numSides === 3,
        )
        for (const triangFace of triangFaces) {
          const adjFacets = triangFace
            .adjacentFaces()
            .filter((f) => forme.isFacetFace(f, "face"))
          expect(adjFacets).toHaveLength(1)
        }
      })

      it("works with diminished", () => {
        const forme = CompositeForme.fromName("diminished cuboctahedron")
        // Make sure the face facets are not connected to any triangular faces
        const faceFacets = forme.geom.faces.filter((f) =>
          forme.isFacetFace(f, "face"),
        )
        for (const face of faceFacets) {
          const adjTriang = face.adjacentFaces().filter((f) => f.numSides === 3)
          expect(adjTriang).toHaveLength(0)
        }
        // Make sure edge faces are connected to at least one triangular face
        const edgeFaces = forme.geom.faces.filter(
          (f) => f.numSides === 4 && !forme.isAnyFacetFace(f),
        )
        for (const face of edgeFaces) {
          const adjTriang = face.adjacentFaces().filter((f) => f.numSides === 3)
          expect(adjTriang).not.toHaveLength(0)
        }
      })

      it("works with gyrate diminished", () => {
        // FIXME!! these checks can definitely be factored out
        const forme = CompositeForme.fromName("gyrate diminished cuboctahedron")

        // Make sure there's an equal number of each facet on source ring
        const sourceFaces = forme.geom.faces.filter(
          (f) => !forme.isGyrateFace(f) && f.numSides === 4,
        )
        const faceFacets = sourceFaces.filter((f) =>
          forme.isFacetFace(f, "face"),
        )
        expect(faceFacets).toHaveLength(4)
        const vertexFacets = sourceFaces.filter((f) =>
          forme.isFacetFace(f, "vertex"),
        )
        expect(vertexFacets).toHaveLength(4)
        // FIXME!! more checks here

        // Check that all the caps are gyrated correctly
        const triangFaces = forme.geom.faces.filter((f) => f.numSides === 3)
        for (const triangFace of triangFaces) {
          const adjFacets = triangFace
            .adjacentFaces()
            .filter((f) => forme.isFacetFace(f, "face"))
          expect(adjFacets).toHaveLength(1)
        }
      })

      it("works with bigyrate", () => {
        const forme = CompositeForme.fromName("bigyrate cuboctahedron")

        // Make sure there's an equal number of each facet on source ring
        const sourceFaces = forme.geom.faces.filter(
          (f) => !forme.isGyrateFace(f),
        )
        const faceFacets = sourceFaces.filter((f) =>
          forme.isFacetFace(f, "face"),
        )
        expect(faceFacets).toHaveLength(4)
        const vertexFacets = sourceFaces.filter((f) =>
          forme.isFacetFace(f, "vertex"),
        )
        expect(vertexFacets).toHaveLength(4)
        // FIXME!! more checks here

        // Check that all the caps are gyrated correctly
        const triangFaces = forme.geom.faces.filter((f) => f.numSides === 3)
        for (const triangFace of triangFaces) {
          const adjFacets = triangFace
            .adjacentFaces()
            .filter((f) => forme.isFacetFace(f, "face"))
          expect(adjFacets).toHaveLength(1)
        }
      })

      it("works with bidiminished", () => {
        const forme = CompositeForme.fromName("bidiminished cuboctahedron")
        const faceFacets = forme.geom.faces.filter((f) =>
          forme.isFacetFace(f, "face"),
        )
        expect(faceFacets).toHaveLength(4)
        const vertexFacets = forme.geom.faces.filter((f) =>
          forme.isFacetFace(f, "vertex"),
        )
        expect(vertexFacets).toHaveLength(4)

        for (const face of faceFacets) {
          const nbrs = face.adjacentFaces().filter((f) => f.numSides === 4)
          expect(nbrs).toSatisfyAll((f) => forme.isFacetFace(f, "vertex"))
        }

        for (const face of vertexFacets) {
          const nbrs = face.adjacentFaces().filter((f) => f.numSides === 4)
          expect(nbrs).toSatisfyAll((f) => forme.isFacetFace(f, "face"))
        }
      })
    })
  })

  describe("caps", () => {
    describe("rhombitetratetrahedron", () => {
      it("only counts four caps for unmodified", () => {
        const forme = CompositeForme.fromName("rhombitetratetrahedron")
        expect(forme.caps()).toHaveLength(4)
      })

      it("only counts one cap for gyrate", () => {
        const forme = CompositeForme.fromName("gyrate rhombitetratetrahedron")
        expect(forme.caps()).toHaveLength(1)
      })

      it("counts no caps for diminished", () => {
        const forme = CompositeForme.fromName(
          "diminished rhombitetratetrahedron",
        )
        expect(forme.caps()).toHaveLength(0)
      })
    })

    describe("rhombicuboctahedron", () => {
      it("only counts two opposite caps for bigyrate", () => {
        const forme = CompositeForme.fromName("bigyrate rhombicuboctahedron")
        const caps = forme.caps()
        expect(caps).toHaveLength(2)
        const [c1, c2] = caps
        expect(c1.isInverse(c2)).toBeTrue()
      })
    })
  })

  describe("gyrateCaps", () => {
    it("returns 1 for gyrate tetratetrahedron", () => {
      const forme = CompositeForme.fromName("gyrate rhombitetratetrahedron")
      expect(forme.gyrateCaps()).toHaveLength(1)
    })

    it("returns one for gyrate rhombicuboctahedron", () => {
      const forme = CompositeForme.fromName("gyrate rhombicuboctahedron")
      expect(forme.gyrateCaps()).toHaveLength(1)
    })

    it("returns one for gyrate diminished rhombicuboctahedron", () => {
      const forme = CompositeForme.fromName(
        "gyrate diminished rhombicuboctahedron",
      )
      expect(forme.gyrateCaps()).toHaveLength(1)
    })

    it("returns two for bigyrate rhombicuboctahedron", () => {
      const forme = CompositeForme.fromName("bigyrate rhombicuboctahedron")
      expect(forme.gyrateCaps()).toHaveLength(2)
    })
  })
})
