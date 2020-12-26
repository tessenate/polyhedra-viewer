import { assertValidSolid } from "./common"

export const alternateNamesMapping: Record<string, string[]> = {
  tetrahedron: [
    "tetrahedron dual",
    "triangular pyramid",
    "digonal antiprism",
    "disphenoid",
  ],
  "truncated tetrahedron": ["truncated tetrahedron dual"],
  cube: ["square prism"],
  octahedron: ["tetratetrahedron", "triangular antiprism", "square bipyramid"],
  icosahedron: [
    "snub tetratetrahedron",
    "gyroelongated pentagonal bipyramid",
    "snub triangular antiprism",
  ],
  cuboctahedron: ["rhombitetratetrahedron", "triangular gyrobicupola"],
  "truncated octahedron": ["truncated tetratetrahedron"],
  rhombicuboctahedron: [
    "elongated square orthobicupola",
    "bigyrate rhombicuboctahedron",
  ],
  icosidodecahedron: ["pentagonal gyrobirotunda"],

  // fastigium
  "triangular prism": ["fastigium", "digonal cupola"],
  gyrobifastigium: ["digonal gyrobicupola"],

  // Augmented solids
  "triangular bipyramid": ["augmented tetrahedron"],
  "elongated square pyramid": ["augmented cube", "augmented square prism"],
  "elongated square bipyramid": [
    "biaugmented cube",
    "biaugmented square prism",
  ],
  // Diminished solids
  "square pyramid": ["diminished octahedron"],
  "pentagonal antiprism": ["parabidiminished icosahedron"],
  "gyroelongated pentagonal pyramid": ["diminished icosahedron"],

  // Gyrate and diminished solids
  "triangular orthobicupola": ["gyrate rhombitetratetrahedron"],
  "triangular cupola": ["diminished rhombitetratetrahedron"],
  "elongated square gyrobicupola": ["gyrate rhombicuboctahedron"],
  "elongated square cupola": [
    "diminished rhombicuboctahedron",
    "gyrate diminished rhombicuboctahedron",
  ],
  "octagonal prism": ["bidiminished rhombicuboctahedron"],

  // Snub antiprisms
  "snub disphenoid": ["snub digonal antiprism"],
}
function* getCanonicalMapping() {
  for (const [canonical, alts] of Object.entries(alternateNamesMapping)) {
    for (const alt of alts) {
      yield [alt, canonical]
    }
  }
}

const canonicalMapping = Object.fromEntries(getCanonicalMapping())
const alternateNames = Object.keys(canonicalMapping)

export function getCanonicalName(name: string) {
  const canonical = canonicalMapping[name]
  if (canonical) return canonical
  return assertValidSolid(name)
}

export function getAlternateNames(name: string) {
  return alternateNamesMapping[name] ?? []
}

export function isAlternateName(name: string) {
  return alternateNames.includes(name)
}
