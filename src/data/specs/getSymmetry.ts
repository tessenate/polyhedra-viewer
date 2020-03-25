import { Symmetry, Polyhedral, Cyclic, Dihedral } from "../symmetry"
import type Specs from "./PolyhedronSpecs"
import type Composite from "./Composite"
import type Capstone from "./Capstone"

const elementaryMapping: Record<string, Symmetry> = {
  sphenocorona: Cyclic.biradial,
  "augmented sphenocorona": Cyclic.bilateral,
  sphenomegacorona: Cyclic.biradial,
  hebesphenomegacorona: Cyclic.biradial,
  disphenocingulum: Dihedral.get(2, "antiprism"),
  bilunabirotunda: Dihedral.get(2, "prism"),
  "triangular hebesphenorotunda": Cyclic.get(3),
}

function getCapstoneSymmetry(capstone: Capstone) {
  // mono-capstones always have cyclic symmetry
  const { gyrate, base } = capstone.data
  if (capstone.isMono()) {
    return Cyclic.get(base)
  }
  const isGyroelongated = capstone.isGyroelongated()

  if (capstone.isPyramid()) {
    return Dihedral.get(base, isGyroelongated ? "antiprism" : "prism")
  }
  // Cupolarotundae are always cyclic, and have reflective symmetry if it is not chiral
  if (capstone.isCupolaRotunda()) {
    return Cyclic.get(base, !!isGyroelongated)
  }
  // Bicupolae and birotundae
  if (isGyroelongated) {
    // Gyroelongated bicupolae and birotundae are chiral
    return Dihedral.get(base)
  }
  return Dihedral.get(base, gyrate === "gyro" ? "antiprism" : "prism")
}

function getCompositeSymmetry(composite: Composite) {
  const {
    augmented = 0,
    gyrate = 0,
    diminished = 0,
    source,
    align,
  } = composite.data
  const count = augmented + gyrate + diminished
  // A composite is "pure" only if it has one type of modification
  const pure = count === augmented || count === diminished || count === gyrate
  switch (count) {
    case 0:
      return source.symmetry()

    case 1:
      // Mono-augmented prisms all have biradial symmetry,
      // everything else has the symmetry of their base polygon
      return source.isPrismatic()
        ? Cyclic.biradial
        : Cyclic.get(source.data.family)

    case 2:
      if (source.isPrismatic()) {
        // para-augmented prisms have digonal prismatic symmetry
        // meta-augmented prisms have biradial symmetry
        return align === "para" ? Dihedral.get(2, "prism") : Cyclic.biradial
      }

      const basePolygon = source.data.family
      // Augmented cubes are always para- and thus have prismatic symmetry
      if (basePolygon === 4) {
        return Dihedral.get(4, "prism")
      }

      if (align === "para") {
        return pure
          ? Dihedral.get(basePolygon, "antiprism")
          : Cyclic.get(basePolygon)
      } else {
        return pure ? Cyclic.biradial : Cyclic.bilateral
      }

    case 3:
      // The only tri-augmented prisms are triangular and hexagonal
      if (source.isPrismatic()) {
        return Dihedral.get(3, "prism")
      }

      // The only classical sources that can be tri-modified are
      // diminished icosahedra and modified rhombicosidodecahedra
      return pure ? Cyclic.get(3) : Cyclic.bilateral

    case 4:
      // The only way this would happen is an augmented tridiminished icosahedron
      return Cyclic.get(3)
  }

  throw new Error("The polyhedron has way too many modifications")
}

export default function getSymmetry(solid: Specs): Symmetry {
  if (solid.isClassical()) {
    const { family, operation } = solid.data
    return Polyhedral.get(family, operation === "snub")
  }
  if (solid.isPrismatic()) {
    const { base, type } = solid.data
    return Dihedral.get(base, type)
  }
  if (solid.isCapstone()) {
    return getCapstoneSymmetry(solid)
  }
  if (solid.isComposite()) {
    return getCompositeSymmetry(solid)
  }
  if (solid.isModifiedAntiprism()) {
    const { source, operation } = solid.data
    switch (operation) {
      case "snub":
        return Dihedral.get(source.data.base, "antiprism")
      default:
        return source.symmetry()
    }
  }
  if (solid.isElementary()) {
    return elementaryMapping[solid.data.base]
  }
  throw new Error(`Solid is of invalid type ${solid.type}`)
}
