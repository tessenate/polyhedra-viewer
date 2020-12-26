import React, { ButtonHTMLAttributes } from "react"
import { useStyle, scales } from "styles"

import { TransitionCtx, PolyhedronCtx } from "components/ViewerPage/context"

import { createForme } from "math/formes"
import { Polyhedron } from "math/polyhedra"
import { andaleMono } from "styles/fonts"
import { hover } from "styles/common"

function ResetButton(props: ButtonHTMLAttributes<Element>) {
  const css = useStyle({
    ...hover,
    alignSelf: "flex-end",
    backgroundColor: "white",
    border: "1px LightGray solid",
    padding: scales.spacing[2],
    fontSize: scales.font[6],
    fontFamily: andaleMono,
  })
  return <button {...props} {...css()} />
}

const buttons = [
  {
    name: "Recenter",
    handler: (polyhedron: Polyhedron) => polyhedron.center(),
  },
  {
    name: "Resize",
    handler: (polyhedron: Polyhedron) => polyhedron.normalizeToVolume(5),
  },
]

export default function ResizeButtons() {
  const polyhedron = PolyhedronCtx.useState()
  const { setPolyhedron } = PolyhedronCtx.useActions()
  const { isTransitioning } = TransitionCtx.useState()

  const css = useStyle({
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    columnGap: scales.spacing[2],
  })
  return (
    <div {...css()}>
      {buttons.map(({ name, handler }) => (
        <ResetButton
          key={name}
          disabled={isTransitioning}
          onClick={() =>
            setPolyhedron(
              createForme(polyhedron.specs, handler(polyhedron.geom)),
            )
          }
        >
          {name}
        </ResetButton>
      ))}
    </div>
  )
}
