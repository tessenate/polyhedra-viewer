import { Color } from "three"
import { PolyhedronForme as Forme, FaceType } from "math/formes"
import { Face } from "math/polyhedra"

export type FaceColor = Color | Color[]

export interface Appearance {
  color: FaceColor
  material: number
}

function createFamilyColor(face: string, vertex: string) {
  const faceColor = new Color(face)
  const vertexColor = new Color(vertex)
  return {
    primary: { face: faceColor, vertex: vertexColor },
    secondary: {
      face: faceColor.clone().offsetHSL(0, 0, -1 / 3),
      vertex: vertexColor.clone().offsetHSL(0, 0, -1 / 3),
    },
    light: {
      face: faceColor.clone().offsetHSL(0, 0, 1 / 8),
      vertex: vertexColor.clone().offsetHSL(0, 0, 1 / 8),
    },
    edge: {
      prism: faceColor.clone().lerp(vertexColor, 1 / 3),
      // .offsetHSL(0, -1 / 4, 0),
      antiprism: faceColor.clone().lerp(vertexColor, 2 / 3),
      // .offsetHSL(0, -1 / 4, 0),
    },
  }
}

const colorScheme = {
  // black + white
  2: createFamilyColor("#000000", "#ffffff"),
  // yellow + orange
  3: createFamilyColor("#ffe100", "#ff6f00"),
  // red + purple
  4: createFamilyColor("#ff3d3d", "#a719ff"),
  // blue + teal
  5: createFamilyColor("#1c7bff", "#42f5ce"),
}

export function toColor(color: any): Color {
  if (color instanceof Color) return color
  if (color.color) {
    return { ...color, color: new Color(color.color) }
  }
  return new Color(color)
}

export function lighten(color: Color, amount: number) {
  return toColor(color)
    .clone()
    .offsetHSL(0, 0, amount / 100)
}

export function mixColor(appearance: Appearance, mixer: (c: Color) => Color) {
  const { color, material } = appearance
  const newColor = color instanceof Color ? mixer(color) : color.map(mixer)
  return {
    color: newColor,
    material,
  }
}

// TODO return materials
export function getFaceAppearance(faceType: FaceType): FaceColor {
  if (faceType.type === "classical") {
    const gyrate = faceType.gyrate
    const scheme = colorScheme[faceType.family]
    const baseColor =
      faceType.subtype === "facet"
        ? scheme[faceType.polygonType][faceType.facet]
        : scheme.edge[faceType.expansion]
    return gyrate ? baseColor.clone().offsetHSL(0, -0.5, 0) : baseColor
  }
  if (faceType.type === "capstone") {
    const scheme = colorScheme[faceType.base]
    switch (faceType.faceType) {
      case "elongation": {
        return scheme.edge[faceType.elongation]
      }
      case "prism": {
        return scheme[faceType.polygonType].face
      }
      case "top": {
        return scheme.primary.face
      }
      case "side": {
        const sideColors = faceType.sideColors
        const n = sideColors.length
        if (n === 3) {
          return sideColors.map((col) => {
            switch (col) {
              case "top":
                return scheme.light.vertex
              case "middle":
                return scheme.primary.vertex
              case "base":
                // FIXME base this on the inner color
                return scheme.secondary.vertex
              default:
                throw new Error(`Impossible`)
            }
          })
        }
        if (n === 4) {
          return sideColors.map((col) => {
            switch (col) {
              case "top":
                return scheme.light.face
              case "base":
                return scheme.secondary.face
              default:
                throw new Error(`Square cap face in rotunda?`)
            }
          })
        }
        if (n === 5) {
          return sideColors.map((col) => {
            switch (col) {
              case "top":
                return scheme.light.face
              case "middle":
                return scheme.primary.face
              case "base":
                return scheme.secondary.face
              default:
                throw new Error(`blah`)
            }
          })
        }
        throw new Error(`Invalid numsides for side face`)
      }
    }
  }
  throw new Error(`Unknown face type: ${JSON.stringify(faceType)}`)
}

export default function getFormeColors(forme: Forme, face: Face): Appearance {
  return {
    color: getFaceAppearance(forme.faceAppearance(face)),
    material: 0,
  }
}
