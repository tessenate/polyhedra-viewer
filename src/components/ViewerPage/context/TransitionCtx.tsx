import { noop } from "lodash-es"
import { Vector3, Color } from "three"
import React, { useRef, useEffect, useContext, useCallback } from "react"

import { ChildrenProp } from "types"
import { repeat } from "utils"
import { createHookedContext } from "components/common"
import Config from "components/ConfigCtx"
import PolyhedronCtx from "./PolyhedronCtx"
import transition from "transition"
import { Polyhedron, SolidData } from "math/polyhedra"
import { AnimationData } from "math/operations"
import {
  FaceColor,
  getFaceAppearance,
} from "components/ViewerPage/common/SolidScene/getFormeColors"

function interpFaceColors(col1: FaceColor, col2: FaceColor, t: number) {
  if (col1 instanceof Color && col2 instanceof Color) {
    return col1.clone().lerp(col2, t)
  }
  if (col1 instanceof Array && col2 instanceof Color) {
    const _col2 = repeat(col2, col1.length)
    return col1.map((c, j) => c.clone().lerp(_col2[j], t))
  }
  if (col2 instanceof Array && col1 instanceof Color) {
    const _col1 = repeat(col1, col2.length)
    return _col1.map((c, j) => c.clone().lerp(col2[j], t))
  }
  return (col1 as Color[]).map((c, j) =>
    c.clone().lerp((col2 as Color[])[j], t),
  )
}

const defaultState = {
  solidData: undefined,
  faceColors: undefined,
  isTransitioning: false,
}
interface State {
  solidData?: SolidData
  faceColors?: Color[]
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
  const { animationSpeed, enableAnimation } = config
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

      const { start, endVertices, startColors, endColors } = animationData
      // TODO I *think* we have to do this for duals;
      // remove this when we have some way to fill the duals in.
      const startFaceColors = startColors.map((c) =>
        c ? getFaceAppearance(c) : new Color(),
      )
      const endFaceColors = endColors.map((c) =>
        c ? getFaceAppearance(c) : new Color(),
      )

      anim.set(start.solidData, startFaceColors)
      function lerpColors(t: number) {
        return startFaceColors.map((color, i) =>
          interpFaceColors(color, endFaceColors[i], t),
        )
      }
      transitionId.current = transition(
        {
          duration: 1000 / animationSpeed,
          ease: "easeQuadInOut",
          onFinish: () => {
            setPolyhedron(result)
            anim.reset()
          },
        },
        (t) => {
          // TODO update the vectors instead of creating new ones and updating state each time
          anim.set(
            {
              ...start.solidData,
              vertices: start.vertices.map((v, i) =>
                new Vector3().lerpVectors(v.vec, endVertices[i], t),
              ),
            },
            lerpColors(t),
          )
        },
      )
    },
    [anim, animationSpeed, enableAnimation, setPolyhedron],
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
