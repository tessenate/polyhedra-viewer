import React, { useEffect } from "react"
import { useLocation } from "react-router-dom"

import { useStyle, scales } from "styles"
import { tableSections } from "tables"

import useMediaInfo from "components/useMediaInfo"
import { usePageTitle } from "components/common"

import Markdown from "./Markdown"
import TableSection from "./TableSection"
import * as text from "./text"
import Masthead from "./Masthead"
import ShareLinks from "./ShareLinks"
import { flexColumn, paddingVert } from "styles/common"

function Main() {
  const { device, orientation } = useMediaInfo()
  const narrow = device === "mobile" && orientation === "portrait"

  const css = useStyle({ width: "100%" })
  const sections = useStyle(paddingVert(scales.spacing[4]))
  return (
    <main {...css()}>
      <Masthead />
      <div {...sections()}>
        {tableSections.map((sectionData) => (
          <TableSection
            narrow={narrow}
            key={sectionData.header}
            data={sectionData}
          />
        ))}
      </div>
    </main>
  )
}

function Footer() {
  const css = useStyle({
    padding: scales.spacing[4],
    display: "grid",
    gridGap: scales.spacing[4],
    justifyItems: "center",
    width: "100%",
    borderTop: "1px solid LightGray",
    textAlign: "center",
  })

  return (
    <footer {...css()}>
      <ShareLinks />
      <div>
        <Markdown source={text.footer} />
      </div>
    </footer>
  )
}

export default function HomePage() {
  const hash = useLocation().hash.substring(1)
  useEffect(() => {
    const el = document.getElementById(hash)
    if (el !== null) {
      el.scrollIntoView(false)
    }
  }, [hash])

  usePageTitle("Polyhedra Viewer")

  const css = useStyle({
    ...flexColumn("center", "center"),
    width: "100vw",
  })

  return (
    <div {...css()}>
      <Main />
      <Footer />
    </div>
  )
}
