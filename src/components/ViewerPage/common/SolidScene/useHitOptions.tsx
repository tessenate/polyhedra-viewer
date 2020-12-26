import { useCallback } from "react"
import { isEmpty, isEqual } from "lodash-es"
import { Vector3 } from "three"

import {
  PolyhedronCtx,
  OperationCtx,
  TransitionCtx,
  useApplyOperation,
} from "../../context"

export default function useHitOptions() {
  const polyhedron = PolyhedronCtx.useState()
  const { isTransitioning } = TransitionCtx.useState()
  const { operation, options = {} } = OperationCtx.useState()
  const { setOption } = OperationCtx.useActions()
  const applyOperation = useApplyOperation()
  const { hitOption = "" } = operation ?? {}

  const setHitOption = (hitPnt: Vector3) => {
    if (!operation || isTransitioning) return
    const newHitOptions = operation.getHitOption(polyhedron, hitPnt)
    if (isEmpty(newHitOptions)) {
      return setOption(hitOption, undefined)
    }
    const newValue = newHitOptions[hitOption]
    if (!isEqual(options[hitOption], newValue)) {
      setOption(hitOption, newValue)
    }
  }

  const unsetHitOption = () => {
    if (!operation) return
    setOption(hitOption, undefined)
  }
  const applyWithHitOption = useCallback(
    (hitPnt: Vector3) => {
      if (!operation || isTransitioning) return
      const hitOptions = operation.getHitOption(polyhedron, hitPnt)
      // only apply operation if we have a hit
      if (options && hitOptions[hitOption]) {
        applyOperation(operation, { ...options, ...hitOptions }, (result) => {
          const newHitOptions = operation.getHitOption(result, hitPnt)
          setOption(hitOption, newHitOptions[hitOption])
        })
      }
    },
    [
      operation,
      applyOperation,
      hitOption,
      isTransitioning,
      options,
      polyhedron,
      setOption,
    ],
  )
  return { setHitOption, unsetHitOption, applyWithHitOption }
}
