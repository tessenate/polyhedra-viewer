import React, { ButtonHTMLAttributes } from "react"
import { useStyle, scales } from "styles"

import { PolyhedronCtx, OperationCtx } from "components/ViewerPage/context"
import OptionIcon from "./OptionIcon"
import { verdana } from "styles/fonts"
import { hover, square, flexRow, flexColumn } from "styles/common"

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  optValue: string
  selected: boolean
}

function OptionButton({ optValue, selected, ...htmlProps }: BtnProps) {
  const css = useStyle(
    {
      ...hover,
      ...square(scales.size[3]),
      border: selected ? "2px DarkSlateGray solid" : "1px LightGray solid",
      backgroundColor: "white",
      fontFamily: verdana,
    },
    [selected],
  )
  return (
    <button {...htmlProps} {...css()}>
      <OptionIcon name={optValue} />
      {optValue}
    </button>
  )
}

export default function AugmentOptions() {
  const polyhedron = PolyhedronCtx.useState()
  const { operation, options } = OperationCtx.useState()
  const { setOption } = OperationCtx.useActions()

  const css = useStyle({
    ...flexRow("center", "space-between"),
    width: "100%",
    height: "100%",
  })

  const optionCss = useStyle({
    ...flexColumn(),
    pointerEvents: "initial",
  })

  return (
    <div {...css()}>
      {["gyrate", "using"].map((name) => {
        const value = options![name]
        const optValues = operation?.allOptions(polyhedron, name)
        if (!optValues || optValues.length < 2) return null
        return (
          <div key={name} {...optionCss()}>
            {optValues.map((optValue) => (
              <OptionButton
                key={optValue}
                optValue={optValue}
                onClick={() => setOption(name, optValue)}
                disabled={!value}
                selected={value === optValue}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}
