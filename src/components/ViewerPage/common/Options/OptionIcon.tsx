import { take } from "lodash-es"

import React, { memo } from "react"

import { useStyle, scales } from "styles"
import {
  Point2D,
  Polygon,
  PolyLine,
  PolyShape,
  polygonPoints,
} from "components/svg"
import { square } from "styles/common"

interface Props {
  name: string
}

const color = "DimGray"

function InnerIcon({ name }: Props) {
  const inner = useStyle({
    stroke: color,
    fill: "none",
    strokeWidth: 5,
    strokeLinejoin: "round",
  })
  const outer = useStyle({
    stroke: color,
    fill: "none",
    strokeWidth: 8,
    strokeLinejoin: "round",
  })

  switch (name) {
    case "ortho":
      return (
        <>
          <Polygon {...outer()} n={5} cx={100} cy={100} a={90} r={100} />
          <Polygon {...inner()} n={5} cx={100} cy={100} a={90} r={66} />
        </>
      )
    case "gyro":
      return (
        <>
          <Polygon {...outer()} n={5} cx={100} cy={100} a={90} r={100} />
          <Polygon {...inner()} n={5} cx={100} cy={100} a={-90} r={66} />
        </>
      )
    case "cupola": {
      const center = 100
      const height = 50
      const topY = center - height
      const bottomY = center + height
      const topWidth = 50
      const bottomWidth = 90
      const topLeftX = center - topWidth
      const topRightX = center + topWidth
      return (
        <>
          <PolyShape
            {...outer()}
            points={[
              [topRightX, topY],
              [topLeftX, topY],
              [center - bottomWidth, bottomY],
              [center + bottomWidth, bottomY],
            ]}
          />
          <PolyLine
            {...inner()}
            points={[
              [topLeftX, topY],
              [topLeftX, bottomY],
              [topRightX, bottomY],
              [topRightX, topY],
            ]}
          />
        </>
      )
    }
    case "rotunda": {
      const points = take(polygonPoints({ n: 12, cx: 100, cy: 150, r: -90 }), 7)
      const [p1, p2, p3, p4, p5, p6] = points
      const bottomY = p1[1]
      const q1: Point2D = [p3[0], p2[1]]
      const q2: Point2D = [p5[0], p6[1]]
      return (
        <>
          <PolyShape {...outer()} points={points} />
          <PolyShape
            {...inner()}
            points={[[70, bottomY], q1, p4, q2, [130, bottomY]]}
          />
          <PolyLine
            {...inner()}
            points={[p3, q1, [40, bottomY], [160, bottomY], q2, p5]}
          />
        </>
      )
    }
    default:
      throw new Error("unknown icon type")
  }
}
export default memo(function OptionIcon({ name }: Props) {
  const css = useStyle(square(scales.size[2]))
  return (
    <svg viewBox="0 0 200 200" {...css()}>
      <InnerIcon name={name} />
    </svg>
  )
})
