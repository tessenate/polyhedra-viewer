import { pick } from "lodash-es"
import React, { useRef, useState } from "react"
import { Table } from "tables"
import ConfigCtx from "components/ConfigCtx"
import { fromSpecs } from "math/formes"

import { useFrame } from "react-three-fiber"
// FIXME edit these imports
import getFormeColors, {
  mixColor,
} from "components/ViewerPage/common/SolidScene/getFormeColors"
import PolyhedronModel from "components/ViewerPage/common/SolidScene/PolyhedronModel"

const rowSpacing = 2
const colSpacing = 7
const innerSpacing = 3

// FIXME add these typings (once we have a more concrete design)
function PolyhedronEntry({ entry, position, navigate }: any) {
  const ref = useRef<any>()
  const [hovered, setHovered] = useState(false)
  useFrame(() => {
    const rotation = ref.current?.rotation
    if (rotation) {
      rotation.y += 0.01
    }
  })
  if (!entry || typeof entry === "string") return null
  // TODO might as well make this an official method
  // (it returns false for gyrobifastigium)
  const isDupe = entry.name() !== entry.canonicalName()
  const forme = fromSpecs(entry)
  const geom = forme.orient()

  const config = ConfigCtx.useState()
  const faceColors = geom.faces.map((face) => {
    let color = getFormeColors(forme, face)
    // FIXME desaturate if it's a duplicate
    // if (isDupe) {
    //   color = mixColor(color, (c) => c.clone().offsetHSL(0, -0.25, -0.1))
    // }
    if (hovered) {
      color = mixColor(color, (c) => c.clone().offsetHSL(0, 0, 0.2))
    }
    return color
  })

  return (
    <group
      ref={ref}
      position={position}
      scale={isDupe ? [2 / 3, 2 / 3, 2 / 3] : [1, 1, 1]}
    >
      <PolyhedronModel
        onClick={() => navigate(`/${escape(entry.name())}`)}
        onPointerMove={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        value={geom.solidData}
        appearance={faceColors}
        config={pick(config, ["showFaces", "showEdges", "showInnerFaces"])}
      />
    </group>
  )
}

function PolyhedronEntryGroup({ entry, position, navigate }: any) {
  if (!entry || typeof entry === "string") return null
  if (entry instanceof Array) {
    return (
      <group>
        {entry.map((e, i) => {
          return (
            <PolyhedronEntry
              key={i}
              entry={e}
              navigate={navigate}
              position={[
                position[0] - innerSpacing * (0.5 - i),
                position[1],
                position[2],
              ]}
            />
          )
        })}
      </group>
    )
  }
  return (
    <PolyhedronEntry entry={entry} navigate={navigate} position={position} />
  )
}

function PolyhedronRow({ row, position, navigate }: any) {
  return (
    <group position={position}>
      {row.map((entry: any, i: number) => (
        <PolyhedronEntryGroup
          key={i}
          navigate={navigate}
          entry={entry}
          position={[i * colSpacing, position[1], 0]}
        />
      ))}
    </group>
  )
}

interface Props {
  table: Table
  // FIXME figure out how not to need to pass this all the way down
  navigate: (blah: any) => void
}

export default function PolyhedronTable({ table, navigate }: Props) {
  const { data } = table
  return (
    <group>
      {data.map((row, i) => (
        <PolyhedronRow
          key={i}
          row={row}
          navigate={navigate}
          position={[0, -i * rowSpacing, 0]}
        />
      ))}
    </group>
  )
}
