import { getSpecs } from "../getSpecs"

describe("getSymmetry", () => {
  function expectSymmetry(solid: string, expected: string) {
    expect(getSpecs(solid).symmetry().symbolStr()).toEqual(expected)
  }

  describe("Platonic and Archimedean solids", () => {
    it("returns chiral on snub polyhedra", () => {
      expectSymmetry("snub cuboctahedron", "O")
      expectSymmetry("snub icosidodecahedron", "I")
    })
    it("returns full symmetry on other solids", () => {
      expectSymmetry("tetrahedron", "T_d")
      expectSymmetry("truncated cube", "O_h")
      expectSymmetry("rhombicosidodecahedron", "I_h")
    })
    it("does not return chiral for repeated polyhedra", () => {
      expectSymmetry("icosahedron", "I_h")
      expectSymmetry("octahedron", "O_h")
      expectSymmetry("cuboctahedron", "O_h")
    })
  })

  describe("capstones", () => {
    it("returns dihedral symmetry on prisms", () => {
      expectSymmetry("pentagonal antiprism", "D_5d")
      expectSymmetry("hexagonal prism", "D_6h")
      expectSymmetry("octagonal antiprism", "D_8d")
    })

    it("returns pyramidal symmetry for mono-capstones", () => {
      expectSymmetry("square pyramid", "C_4v")
      expectSymmetry("elongated triangular cupola", "C_3v")
      expectSymmetry("gyroelongated pentagonal rotunda", "C_5v")
    })

    it("returns D_2d for gyrobifastigium", () => {
      expectSymmetry("digonal gyrobicupola", "D_2d")
    })

    it("returns dihedral symmetry on bipyramids", () => {
      expectSymmetry("pentagonal bipyramid", "D_5h")
      expectSymmetry("elongated triangular bipyramid", "D_3h")
      expectSymmetry("gyroelongated square bipyramid", "D_4d")
    })

    it("returns cyclic symmetry on cupolarotundae", () => {
      expectSymmetry("pentagonal orthocupolarotunda", "C_5v")
      expectSymmetry("elongated pentagonal gyrocupolarotunda", "C_5v")
      expectSymmetry("gyroelongated pentagonal cupolarotunda", "C_5")
    })

    it("returns dihedral on bicupolae and birotundae", () => {
      expectSymmetry("square orthobicupola", "D_4h")
      expectSymmetry("elongated triangular orthobicupola", "D_3h")
      expectSymmetry("elongated pentagonal gyrobicupola", "D_5d")
      expectSymmetry("gyroelongated pentagonal birotunda", "D_5")
    })
  })

  describe("augmented prisms", () => {
    it("returns C_2v on mono-augmented", () => {
      expectSymmetry("augmented triangular prism", "C_2v")
      expectSymmetry("augmented pentagonal prism", "C_2v")
    })

    it("works on biaugmented", () => {
      expectSymmetry("biaugmented pentagonal prism", "C_2v")
      expectSymmetry("parabiaugmented hexagonal prism", "D_2h")
    })

    it("works on triaugmented", () => {
      expectSymmetry("triaugmented triangular prism", "D_3h")
      expectSymmetry("triaugmented hexagonal prism", "D_3h")
    })
  })

  describe("augmented Platonic and Archimedean solids", () => {
    it("returns the cyclic face symmetry on mono-augmanted", () => {
      expectSymmetry("augmented truncated tetrahedron", "C_3v")
      expectSymmetry("augmented truncated cube", "C_4v")
      expectSymmetry("augmented dodecahedron", "C_5v")
    })

    it("depends on alignment for biaugmented", () => {
      expectSymmetry("biaugmented truncated cube", "D_4h")
      expectSymmetry("parabiaugmented dodecahedron", "D_5d")
      expectSymmetry("metabiaugmented truncated dodecahedron", "C_2v")
    })

    it("returns C_3v on triaugmented", () => {
      expectSymmetry("triaugmented dodecahedron", "C_3v")
      expectSymmetry("triaugmented truncated dodecahedron", "C_3v")
    })
  })

  describe("diminished icosahedra", () => {
    expectSymmetry("metabidiminished icosahedron", "C_2v")
    expectSymmetry("tridiminished icosahedron", "C_3v")
    expectSymmetry("augmented tridiminished icosahedron", "C_3v")
  })

  describe("gyrate and diminished rhombicosidodecahedra", () => {
    it("returns C_5v on a mono-{operation}", () => {
      expectSymmetry("diminished rhombicosidodecahedron", "C_5v")
      expectSymmetry("gyrate rhombicosidodecahedron", "C_5v")
    })

    it("returns 5-fold dihedral or cyclic on a para-bi-{operation}", () => {
      expectSymmetry("parabidiminished rhombicosidodecahedron", "D_5d")
      expectSymmetry("paragyrate diminished rhombicosidodecahedron", "C_5v")
    })

    it("returns bilateral or biradial symmetry on a meta-bi-{operation}", () => {
      expectSymmetry("metabigyrate rhombicosidodecahedron", "C_2v")
      expectSymmetry("metagyrate diminished rhombicosidodecahedron", "C_1v")
    })

    it("returns C_3v or biradial on tri-{operation}", () => {
      expectSymmetry("tridiminished rhombicosidodecahedron", "C_3v")
      expectSymmetry("bigyrate diminished rhombicosidodecahedron", "C_1v")
    })
  })

  describe("elementary solids", () => {
    it("works", () => {
      expectSymmetry("snub digonal antiprism", "D_2d")
      expectSymmetry("sphenocorona", "C_2v")
      expectSymmetry("augmented sphenocorona", "C_1v")
    })
  })
})
