import ClassicalForme from "../ClassicalForme"

describe("ClassicalForme", () => {
  describe("facet faces", () => {
    it("works correctly for snub tetratetrahedron", () => {
      const forme = ClassicalForme.fromName("snub tetratetrahedron")
      const faceFaces = forme.facetFaces("face")
      const vertexFaces = forme.facetFaces("vertex")
      for (const vertexFace of vertexFaces) {
        if (faceFaces.some((face) => vertexFace.inSet(face.adjacentFaces()))) {
          fail(`Vertex face #${vertexFace.index} is adjacent to a face-face`)
        }
      }
    })
  })
})
