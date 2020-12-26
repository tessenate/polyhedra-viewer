import { PrimaryPolygon, FacetType, PolygonType, PrismaticType } from "specs"

interface BaseClassical {
  type: "classical"
  family: PrimaryPolygon
  gyrate?: boolean
}

interface ClassicalFacet extends BaseClassical {
  subtype: "facet"
  polygonType: PolygonType
  facet: FacetType
}

interface ClassicalEdge extends BaseClassical {
  subtype: "edge"
  expansion: PrismaticType
}

type ClassicalFaceType = ClassicalFacet | ClassicalEdge

export const ClassicalFace = {
  facet(
    family: PrimaryPolygon,
    polygonType: PolygonType,
    facet: FacetType,
    gyrate?: boolean,
  ): ClassicalFaceType {
    return {
      type: "classical",
      subtype: "facet",
      family,
      polygonType,
      facet,
      gyrate,
    }
  },

  edge(
    family: PrimaryPolygon,
    expansion: PrismaticType,
    gyrate?: boolean,
  ): ClassicalFaceType {
    return { type: "classical", subtype: "edge", family, expansion, gyrate }
  },
}

interface BaseCapstone {
  type: "capstone"
  base: 2 | PrimaryPolygon
}

interface CapstoneElongation extends BaseCapstone {
  faceType: "elongation"
  elongation: PrismaticType
}

interface CapstonePrismBase extends BaseCapstone {
  faceType: "prism"
  polygonType: PolygonType
}

interface CapstoneCapTop extends BaseCapstone {
  faceType: "top"
}

interface CapstoneCapSide extends BaseCapstone {
  faceType: "side"
  sideColors: ("top" | "middle" | "base")[]
}

type CapstoneFaceType =
  | CapstoneElongation
  | CapstonePrismBase
  | CapstoneCapTop
  | CapstoneCapSide

export const CapstoneFace = {
  side(base: 2 | PrimaryPolygon, elongation: PrismaticType): CapstoneFaceType {
    return { type: "capstone", faceType: "elongation", base, elongation }
  },

  prismBase(
    base: 2 | PrimaryPolygon,
    polygonType: PolygonType,
  ): CapstoneFaceType {
    return { type: "capstone", faceType: "prism", base, polygonType }
  },

  capTop(base: 2 | PrimaryPolygon): CapstoneFaceType {
    return { type: "capstone", faceType: "top", base }
  },

  capSide(
    base: 2 | PrimaryPolygon,
    sideColors: ("top" | "middle" | "base")[],
  ): CapstoneFaceType {
    return {
      type: "capstone",
      faceType: "side",
      base,
      sideColors,
    }
  },
}

export type FaceType = ClassicalFaceType | CapstoneFaceType
