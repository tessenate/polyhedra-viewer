import { Color } from "three"
import { useMemo, useCallback } from "react"
import { PolyhedronCtx, OperationCtx, TransitionCtx } from "../../context"
import { Polyhedron, Face } from "math/polyhedra"
import getFormeColors, { Appearance, mixColor, lighten } from "./getFormeColors"

// Hook that takes data from Polyhedron and Animation states and decides which to use.
export default function useSolidContext() {
  const polyhedron = PolyhedronCtx.useState()

  const {
    solidData,
    isTransitioning,
    faceColors = [],
  } = TransitionCtx.useState()
  const { operation, options = {} } = OperationCtx.useState()

  const getSelectionColor = useCallback(
    (face: Face, appearance: Appearance) => {
      if (!operation) return appearance
      switch (operation.selectionState(face, polyhedron, options)) {
        case "selected":
          return mixColor(appearance, (c) => lighten(c, 25))
        case "selectable":
          return mixColor(appearance, (c) => lighten(c, 10))
        default:
          return appearance
      }
    },
    [operation, options, polyhedron],
  )

  const formeColors = useMemo(() => {
    // FIXME not this isn't working right now
    return polyhedron.geom.faces.map((f) =>
      getSelectionColor(f, getFormeColors(polyhedron, f)),
    )
  }, [polyhedron, getSelectionColor])

  // Colors when animation is being applied
  const transitionColors = useMemo(() => {
    return (
      isTransitioning && faceColors.map((color) => ({ color, material: 0 }))
    )
  }, [faceColors, isTransitioning])
  const geom: Polyhedron = polyhedron.geom

  // Colors when in operation mode and hit options are being selected
  const operationColors = useMemo(() => {
    return geom.faces.map((face) =>
      getSelectionColor(face, {
        color: new Color(),
        material: 0,
      }),
    )
  }, [geom.faces, getSelectionColor])

  const normalizedColors: Appearance[] = useMemo(() => {
    return (
      transitionColors ||
      formeColors ||
      operationColors ||
      geom.faces.map((f) => ({
        color: new Color(),
        material: 0,
      }))
    )
  }, [formeColors, transitionColors, operationColors, geom])

  return {
    colors: normalizedColors,
    solidData: isTransitioning ? solidData! : polyhedron.geom.solidData,
  }
}
