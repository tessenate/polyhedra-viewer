import React from "react"
import { useStyle, scales, media } from "styles"
import { capitalize } from "lodash-es"

import { fonts } from "styles"

import { PolyhedronCtx } from "components/ViewerPage/context"
import DataDownloader from "../DataDownloader"
import { flexColumn } from "styles/common"

import { RenderProps } from "./renderFuncs"
import DataList from "./DataList"

function Heading({ info }: RenderProps) {
  const css = useStyle({
    fontSize: scales.font[3],
    marginBottom: scales.spacing[1],
    lineHeight: 1.25,
  })
  return (
    <h2 {...css()}>
      {capitalize(info.canonicalName())} | {info.conwaySymbol()}
    </h2>
  )
}

export default function InfoPanel() {
  const polyhedron = PolyhedronCtx.useState()

  const css = useStyle({
    ...flexColumn(),
    borderSpacing: 8,
    borderCollapse: "separate",
    padding: scales.spacing[3],
    fontFamily: fonts.times,

    // On non-mobile, display the download links on the bottom
    [media.notMobile]: { height: "100%" },
  })

  const typeCss = useStyle({
    fontSize: scales.font[5],
    color: "DimGrey",
    marginBottom: scales.spacing[3],
  })

  const downloaderCss = useStyle({
    [media.mobile]: { marginTop: scales.spacing[4] },
    [media.notMobile]: { marginTop: "auto" },
  })

  const info = polyhedron.specs

  return (
    <div {...css()}>
      <Heading polyhedron={polyhedron.geom} info={info} />
      <p {...typeCss()}>{info.group()}</p>
      <DataList polyhedron={polyhedron.geom} info={info} />
      <div {...downloaderCss()}>
        <DataDownloader
          name={polyhedron.specs.name()}
          solid={polyhedron.geom.rawSolidData()}
        />
      </div>
    </div>
  )
}
