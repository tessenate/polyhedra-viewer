import React, { ComponentType } from "react"
import { round } from "lodash-es"
import { Link } from "react-router-dom"

import { escape } from "utils"
import { fonts, useStyle, scales } from "styles"

import {
  Sup,
  RenderProps,
  displayFaceTypes,
  displayVertexConfig,
  displaySymmetry,
  displayProperties,
} from "./renderFuncs"

interface InfoRow {
  name: string
  area: string
  render: ComponentType<RenderProps>
}

const infoRows: InfoRow[] = [
  {
    name: "Vertices",
    area: "verts",
    render: ({ polyhedron }) => <>{polyhedron.numVertices()}</>,
  },
  {
    name: "Edges",
    area: "edges",
    render: ({ polyhedron }) => <>{polyhedron.numEdges()}</>,
  },
  {
    name: "Faces",
    area: "faces",
    render: ({ polyhedron }) => <>{polyhedron.numFaces()}</>,
  },
  {
    name: "Vertex configuration",
    area: "vconf",
    render: displayVertexConfig,
  },
  {
    name: "Faces by type",
    area: "ftype",
    render: displayFaceTypes,
  },

  {
    name: "Volume",
    area: "vol",
    render: ({ polyhedron: p }) => (
      <>
        ≈{round(p.normalizedVolume(), 3)}s<Sup>{3}</Sup>
      </>
    ),
  },
  {
    name: "Surface area",
    area: "sa",
    render: ({ polyhedron: p }) => (
      <>
        ≈{round(p.normalizedSurfaceArea(), 3)}s<Sup>{2}</Sup>
      </>
    ),
  },
  {
    name: "Sphericity",
    area: "spher",
    render: ({ polyhedron: p }) => <>≈{round(p.sphericity(), 3)}</>,
  },

  { name: "Symmetry", area: "sym", render: displaySymmetry },
  {
    name: "Order",
    area: "order",
    render: ({ info }) => <>{info.symmetry().order()}</>,
  },
  {
    name: "Properties",
    area: "props",
    render: displayProperties,
  },
  {
    name: "Also known as",
    area: "alt",
    render: ({ info }: RenderProps) => {
      const alts = info.alternateNames()
      if (alts.length === 0) return <>--</>
      return (
        <ul>
          {alts.map((alt) => (
            <li key={alt}>
              <Link to={`/${escape(alt)}/info`}>{alt}</Link>
            </li>
          ))}
        </ul>
      )
    },
  },
]

function Datum({
  info,
  polyhedron,
  name,
  area,
  render: Renderer,
}: InfoRow & RenderProps) {
  const css = useStyle({ marginBottom: 10 })
  const nameCss = useStyle({
    fontSize: scales.font[5],
    marginBottom: scales.spacing[1],
  })
  const valueCss = useStyle({
    fontFamily: fonts.andaleMono,
    color: "DimGrey",
  })

  return (
    <div {...css()} style={{ gridArea: area }}>
      <dd {...nameCss()}>{name}</dd>
      <dt {...valueCss()}>
        <Renderer polyhedron={polyhedron} info={info} />
      </dt>
    </div>
  )
}

export default function DataList(props: RenderProps) {
  const css = useStyle({
    display: "grid",
    gridTemplateAreas: `
      "verts verts edges edges faces faces"
      "vconf vconf vconf ftype ftype ftype"
      "vol   vol   sa    sa    spher spher"
      "sym   sym   sym   sym   order order"
      "props props props props props props"
      "alt   alt   alt   alt   alt   alt"
    `,
    gridRowGap: scales.spacing[2],
  })

  return (
    <dl {...css()}>
      {infoRows.map((rowProps) => (
        <Datum key={rowProps.name} {...rowProps} {...props} />
      ))}
    </dl>
  )
}
