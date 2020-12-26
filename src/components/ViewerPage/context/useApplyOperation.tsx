import { useCallback } from "react"
import { Operation } from "math/operations"
import { PolyhedronForme } from "math/formes"
import PolyhedronCtx from "./PolyhedronCtx"
import OperationCtx from "./OperationCtx"
import TransitionCtx from "./TransitionCtx"

type ResultCallback = (polyhedron: PolyhedronForme) => void

// TODO figure out stricter typing here
type Options = any
export default function useApplyOperation() {
  const { setOperation, unsetOperation } = OperationCtx.useActions()
  const polyhedron = PolyhedronCtx.useState()
  const transition = TransitionCtx.useTransition()

  const applyOperation = useCallback(
    (
      operation: Operation<Options>,
      options: Options = {},
      callback?: ResultCallback,
    ) => {
      if (!operation) throw new Error("no operation defined")

      const { result, animationData } = operation.apply(polyhedron, options)
      // If the current operation has options and the result has options,
      // keep the options set
      if (
        operation.hasOptions(polyhedron) &&
        operation.canApplyTo(result) &&
        operation.hasOptions(result)
      ) {
        setOperation(operation, result)
      } else {
        unsetOperation()
      }

      transition(result, animationData)
      callback?.(result)
    },
    [polyhedron, transition, setOperation, unsetOperation],
  )

  return applyOperation
}
