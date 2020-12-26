import { pick } from "lodash-es"
import React from "react"
import { Canvas } from "react-three-fiber"
import { TrackballControls, PerspectiveCamera } from "drei"
import ThreePolyhedron from "./PolyhedronModel"
import useSolidContext from "./useSolidContext"
import useHitOptions from "./useHitOptions"
import ConfigCtx from "components/ConfigCtx"

export default function ViewerScene() {
  const { colors, solidData } = useSolidContext()
  const { setHitOption, unsetHitOption, applyWithHitOption } = useHitOptions()
  const config = ConfigCtx.useState()
  return (
    <Canvas gl={{ antialias: true }}>
      <TrackballControls enabled noPan rotateSpeed={8.0} />
      <PerspectiveCamera makeDefault position={[0, 0, 5]}>
        <pointLight />
      </PerspectiveCamera>
      <ThreePolyhedron
        value={solidData}
        appearance={colors}
        config={pick(config, ["showFaces", "showEdges", "showInnerFaces"])}
        onPointerMove={setHitOption}
        onClick={applyWithHitOption}
        onPointerOut={unsetHitOption}
      />
    </Canvas>
  )
}
