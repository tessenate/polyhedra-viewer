import { mean } from "lodash-es"
import { Vector3 } from "three"
import { PolyhedronSpecs, FacetType } from "specs"
import { Classical, Capstone, Composite, Elementary } from "specs"
import { Polyhedron, Face, Cap } from "math/polyhedra"

import type ClassicalForme from "./ClassicalForme"
import type CapstoneForme from "./CapstoneForme"
import type CompositeForme from "./CompositeForme"
import type ElementaryForme from "./ElementaryForme"
import { FaceType } from "./FaceType"
import {
  Orientation,
  Pose,
  alignPolyhedron,
} from "math/operations/operationUtils"
import { find } from "utils"

export type PolyhedronForme<
  S extends PolyhedronSpecs = PolyhedronSpecs
> = S extends Classical
  ? ClassicalForme
  : S extends Capstone
  ? CapstoneForme
  : S extends Composite
  ? CompositeForme
  : S extends Elementary
  ? ElementaryForme
  : never

export default abstract class BaseForme<Specs extends PolyhedronSpecs> {
  specs: Specs
  geom: Polyhedron

  constructor(specs: Specs, geom: Polyhedron) {
    this.specs = specs
    this.geom = geom
  }

  isClassical(): this is ClassicalForme {
    return this.specs.isClassical()
  }

  isCapstone(): this is CapstoneForme {
    return this.specs.isCapstone()
  }

  isComposite(): this is CompositeForme {
    return this.specs.isComposite()
  }

  isElementary(): this is ElementaryForme {
    return this.specs.isElementary()
  }

  abstract orientation(): Orientation

  orient() {
    const startPose: Pose = {
      // TODO correctly center diminished polyhedra and capstones
      origin: this.geom.centroid(),
      scale: mean(this.geom.edges.map((e) => e.distanceToCenter())),
      orientation: this.orientation(),
    }

    const endPose: Pose = {
      origin: new Vector3(),
      scale: 1,
      orientation: [new Vector3(0, 1, 0), new Vector3(0, 0, 1)],
    }
    return alignPolyhedron(this.geom, startPose, endPose)
  }

  // Normalize the geometry of this forme
  // (e.g. make sure all the faces are in the right positions)
  normalize(): this {
    return this
  }

  caps(): Cap[] {
    throw new Error(`Cannot get caps for ${this.specs.name()}`)
  }

  abstract faceAppearance(face: Face): FaceType

  // Face Facets
  // ===========
  // A set of methods for getting the "facets" of polyhedral faces
  // TODO make this a mixin instead!

  /**
   * Return whether the given face is a `face` facet or a `vertex` facet.
   *
   * This method should be implemented by subclasses
   */
  getFacet(face: Face): FacetType | null {
    throw new Error(`Forme ${this.specs.name()} does not support getFacet`)
  }

  isFacetFace(face: Face, facet: FacetType) {
    return this.getFacet(face) === facet
  }

  isEdgeFace(face: Face) {
    return !this.getFacet(face)
  }

  edgeFace() {
    return find(this.geom.faces, (face) => this.isEdgeFace(face))
  }

  edgeFaces() {
    return this.geom.faces.filter((f) => this.isEdgeFace(f))
  }

  isAnyFacetFace(face: Face) {
    return !!this.getFacet(face)
  }

  facetFace(facet: FacetType) {
    return find(this.geom.faces, (face) => this.isFacetFace(face, facet))
  }

  facetFaces(facet: FacetType) {
    return this.geom.faces.filter((face) => this.isFacetFace(face, facet))
  }
}
