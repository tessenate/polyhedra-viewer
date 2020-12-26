import React, { Suspense } from "react"
import { Route, Routes } from "react-router-dom"

import usePageTracker from "./usePageTracker"
import Loading from "./Loading"

const HomePage = React.lazy(() => import("./HomePage"))
const ViewerPage = React.lazy(() => import("./ViewerPage"))
const MuseumPage = React.lazy(() => import("./MuseumPage"))

export default function App() {
  usePageTracker()
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<MuseumPage />} />
        <Route path="/index-old" element={<HomePage />} />
        <Route path=":solid/*" element={<ViewerPage />} />
      </Routes>
    </Suspense>
  )
}
