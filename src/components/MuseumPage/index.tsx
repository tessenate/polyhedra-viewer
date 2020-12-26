import React from "react"
import { Canvas } from "react-three-fiber"
import { useStyle } from "styles"
import { tableSections } from "tables"
import PolyhedronTable from "./PolyhedronTable"
import { useNavigate } from "react-router-dom"
import { PerspectiveCamera, TrackballControls } from "drei"

// TODO deduplicate with the controls in the other scene
const sectionSpacing = 50
const subsecSpacing = 25
// TODO why is this so slow to load??
export default function MuseumScene() {
  const navigate = useNavigate()
  const style = useStyle({
    position: "absolute",
    backgroundColor: "#111",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  })
  return (
    <div {...style()}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 75]}>
          {[]}
        </PerspectiveCamera>
        <directionalLight position={[0, 0.5, 1]} />
        <TrackballControls enabled noRotate />
        <group>
          {tableSections.map((section, i) => {
            if (section.tables) {
              return section.tables.map((table, j) => (
                <group key={table.caption} position={[j * subsecSpacing, 0, 0]}>
                  <PolyhedronTable navigate={navigate} table={table} />
                </group>
              ))
            }
            if (section.subsections) {
              return section.subsections.map((subsec, j) => {
                return (
                  <group key={j} position={[0, -(i + j) * sectionSpacing, 0]}>
                    {subsec.tables!.map((table, k) => (
                      <group
                        key={table.caption}
                        position={[k * subsecSpacing, 0, 0]}
                      >
                        <PolyhedronTable navigate={navigate} table={table} />
                      </group>
                    ))}
                  </group>
                )
              })
            }
            return null
          })}
        </group>
      </Canvas>
    </div>
  )
}
