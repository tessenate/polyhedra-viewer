import { capitalize } from "lodash-es"
import React from "react"
import { useStyle, scales } from "styles"

import { media, fonts } from "styles"

function Title({ name }: { name: string }) {
  const css = useStyle({
    fontFamily: fonts.andaleMono,
    fontSize: scales.font[2],
    color: "white",

    [media.notMobile]: {
      fontWeight: "bold",
      textAlign: "left",
    },

    [media.tabletPortrait]: {
      // Otherwise, it bleeds into the sidebar
      fontSize: scales.font[3],
    },

    // TODO consider making this style-less and defining the styles
    // in mobile/desktop viewers
    [media.mobile]: {
      fontSize: scales.font[5],
      lineHeight: 1.25,
      textAlign: "center",
    },
  })
  return (
    <h1 data-testid="viewer-title" {...css()}>
      {capitalize(name)}
    </h1>
  )
}

export default Title
