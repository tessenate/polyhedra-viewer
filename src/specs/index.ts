export type {
  PrimaryPolygon,
  SecondaryPolygon,
  Polygon,
  PolygonType,
  Twist,
} from "./common"
export {
  polygonNames,
  polygonPrefixes,
  primaryPolygons,
  secondaryPolygons,
  polygons,
  polygonTypes,
  twists,
  oppositeTwist,
} from "./common"

export type { PolyhedronSpecs } from "./PolyhedronSpecs"
export { default as Classical, facetTypes, oppositeFacet } from "./Classical"
export type { FacetType } from "./Classical"
export {
  default as Capstone,
  prismaticTypes,
  gyrations,
  capTypes,
} from "./Capstone"
export type { PrismaticType, Gyration, CapType } from "./Capstone"
export { default as Composite, alignments } from "./Composite"
export type { Align } from "./Composite"
export { default as Elementary } from "./Elementary"
export { getSpecs, getCanonicalSpecs } from "./getSpecs"
