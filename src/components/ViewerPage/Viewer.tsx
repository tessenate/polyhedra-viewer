import { capitalize } from "lodash-es"
import React, { useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"

import { escape } from "utils"
import { wrapProviders } from "components/common"
import { OperationCtx, TransitionCtx, PolyhedronCtx } from "./context"
import DesktopViewer from "./DesktopViewer"
import MobileViewer from "./MobileViewer"
import { usePageTitle } from "components/common"
import useMediaInfo from "components/useMediaInfo"

interface InnerProps {
  solid: string
  panel: string
}

function InnerViewer({ solid, panel }: InnerProps) {
  const { unsetOperation } = OperationCtx.useActions()
  const { setPolyhedronToName } = PolyhedronCtx.useActions()
  const polyhedron = PolyhedronCtx.useState()
  const navigate = useNavigate()
  // Use a buffer variable to keep the two states in sync
  const [solidSync, setSolidSync] = React.useState(solid)

  // When either `solid` (derived from the route) or `polyhedron.name` (derived from operation)
  // chagnes, update the *other* state.
  useEffect(() => {
    setSolidSync(solid)
  }, [solid])

  useEffect(() => {
    setSolidSync(polyhedron.specs.name())
  }, [polyhedron.specs])

  useEffect(() => {
    if (polyhedron.specs.name() !== solidSync) {
      // If the route has changed (and it wasn't from an operation)
      // cancel the current operation and set the polyhedorn model
      unsetOperation()
      setPolyhedronToName(solidSync)
    } else if (solid !== solidSync) {
      // If an operation was executed, update the URL
      navigate(`/${escape(polyhedron.specs.name())}/operations`)
    }
    // Don't depend on `solid` or `polyhedron.name` over here:
    // this is how the two states get synced with each other
    // Also don't depend on `navigate` because it's not memoized
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solidSync, setPolyhedronToName, unsetOperation])

  const { device } = useMediaInfo()

  const ViewerComponent = device === "desktop" ? DesktopViewer : MobileViewer

  return <ViewerComponent solid={solid} panel={panel} />
}

const Providers = wrapProviders([TransitionCtx.Provider, OperationCtx.Provider])

export default function Viewer({ solid }: { solid: string }) {
  const { panel = "operations" } = useParams()
  usePageTitle(`${capitalize(solid)} - Polyhedra Viewer`)

  return (
    <PolyhedronCtx.Provider name={solid}>
      <Providers>
        <InnerViewer solid={solid} panel={panel} />
      </Providers>
    </PolyhedronCtx.Provider>
  )
}
