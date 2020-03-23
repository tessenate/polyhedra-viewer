import { noop } from "lodash-es"

import React, { useRef, useEffect, useContext, useCallback } from "react"
import { ChildrenProp } from "types"

import { createHookedContext } from "components/common"
import Config from "components/ConfigCtx"
import PolyhedronCtx from "./PolyhedronCtx"
import transition from "transition"
import { Polyhedron, Face, SolidData } from "math/polyhedra"
import { AnimationData } from "math/operations"
import { PRECISION } from "math/geom"

// TODO move this to the math section
function getCoplanarFaces(polyhedron: Polyhedron) {
  const found: Face[] = []
  const pairs: [Face, Face][] = []
  polyhedron.faces.forEach((f1) => {
    if (f1.inSet(found) || !f1.isValid()) return

    f1.adjacentFaces().forEach((f2) => {
      if (!f2 || !f2.isValid()) return
      if (f1.normal().equalsWithTolerance(f2.normal(), PRECISION)) {
        pairs.push([f1, f2])
        found.push(f1)
        found.push(f2)
        return
      }
    })
  })
  return pairs
}

function getFaceColors(polyhedron: Polyhedron, colors: any) {
  const pairs = getCoplanarFaces(polyhedron)
  const mapping: { [fIndex: number]: number } = {}
  for (const [f1, f2] of pairs) {
    const numSides = f1.numSides + f2.numSides - 2
    mapping[f1.index] = numSides
    mapping[f2.index] = numSides
  }

  return polyhedron.faces.map(
    (face) => colors[mapping[face.index] ?? face.numUniqueSides()],
  )
}

function arrayDefaults<T>(first: T[], second: T[]) {
  return first.map((item, i) => item ?? second[i])
}

const defaultState = {
  solidData: undefined,
  faceColors: undefined,
  isTransitioning: false,
}
interface State {
  solidData?: SolidData
  faceColors?: any[]
  isTransitioning: boolean
}
const InterpModel = createHookedContext<State, "set" | "reset">(
  {
    reset: () => () => defaultState,
    set: (solidData, faceColors) => () => ({
      solidData,
      faceColors,
      isTransitioning: !!solidData,
    }),
  },
  defaultState,
)

const TransitionContext = React.createContext(noop)

function InnerProvider({ children }: ChildrenProp) {
  const transitionId = useRef<ReturnType<typeof transition> | null>(null)
  const { setPolyhedron } = PolyhedronCtx.useActions()
  const config = Config.useState()
  const { colors, animationSpeed, enableAnimation } = config
  const anim = InterpModel.useActions()

  // Cancel the animation if the component we're a part of gets rerendered.
  useEffect(() => {
    return () => {
      if (transitionId.current) {
        transitionId.current.cancel()
      }
    }
  }, [transitionId])
  const transitionFn = useCallback(
    (result: Polyhedron, animationData: AnimationData) => {
      if (!enableAnimation || !animationData) {
        setPolyhedron(result)
        anim.reset()
        return
      }

      const { start, endVertices } = animationData
      const colorStart = getFaceColors(start, colors)
      const colorEnd = getFaceColors(start.withVertices(endVertices), colors)

      // if no colors are defined at the start, use the end colors
      const allColorStart = arrayDefaults(colorStart, colorEnd)
      anim.set(start.solidData, allColorStart)

      transitionId.current = transition(
        {
          duration: 1000 / animationSpeed,
          ease: "easeQuadInOut",
          startValue: {
            vertices: start.solidData.vertices,
            faceColors: allColorStart,
          },
          endValue: {
            vertices: endVertices,
            faceColors: arrayDefaults(colorEnd, colorStart),
          },
          onFinish: () => {
            setPolyhedron(result)
            anim.reset()
          },
        },
        ({ vertices, faceColors }) => {
          anim.set({ ...start.solidData, vertices }, faceColors)
        },
      )
    },
    [anim, animationSpeed, colors, enableAnimation, setPolyhedron],
  )

  return (
    <TransitionContext.Provider value={transitionFn}>
      {children}
    </TransitionContext.Provider>
  )
}

function Provider({ children }: ChildrenProp) {
  return (
    <InterpModel.Provider>
      <InnerProvider>{children}</InnerProvider>
    </InterpModel.Provider>
  )
}

function useTransition() {
  return useContext(TransitionContext)
}

export default {
  Provider,
  useState: InterpModel.useState,
  useTransition,
}
