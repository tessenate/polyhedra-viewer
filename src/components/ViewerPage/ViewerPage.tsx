import React from "react"
import {
  Routes,
  Route,
  Navigate,
  useParams,
  useLocation,
} from "react-router-dom"

import { escape, choose } from "utils"
import { isValidSolid, allSolidNames } from "data/common"
import { isAlternateName } from "data/alternates"
import { isConwayNotation, fromConwayNotation } from "./conway"

import ErrorPage from "components/ErrorPage"
import Viewer from "./Viewer"

const unescapeName = (name: string) => name.replace(/-/g, " ")

function resolveSolidName(solid: string) {
  if (solid === "random") {
    return choose(allSolidNames)
  }
  if (isConwayNotation(solid)) {
    return fromConwayNotation(solid)
  }
  if (isAlternateName(solid) || isValidSolid(solid)) {
    return solid
  }
  return null
}

export default function ViewerPage() {
  const params = useParams()
  const { pathname } = useLocation()
  const solidParam = unescapeName(params.solid)
  const solid = resolveSolidName(solidParam)

  if (!solid) {
    return <ErrorPage />
  }

  if (solid !== solidParam) {
    return (
      <Navigate replace to={pathname.replace(params.solid, escape(solid))} />
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate replace to="operations" />} />
      <Route path=":panel" element={<Viewer solid={solid} />} />
    </Routes>
  )
}
