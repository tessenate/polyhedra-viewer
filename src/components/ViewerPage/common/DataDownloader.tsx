import React from "react"
import Icon from "@mdi/react"

import { useStyle, scales } from "styles"
import { SrOnly } from "components/common"
import { fonts } from "styles"

import { RawSolidData } from "math/polyhedra"
import { hover } from "styles/common"
import { mdiDownload } from "@mdi/js"

function formatDecimal(number: number) {
  return Number.isInteger(number) ? `${number}.0` : number
}

function vToObj(vertex: number[]) {
  return "v " + vertex.map(formatDecimal).join(" ")
}

function fToObj(face: number[]) {
  return "f " + face.map((i) => i + 1).join(" ")
}

function toObj({ vertices, faces }: RawSolidData) {
  const vObj = vertices.map(vToObj)
  const fObj = faces.map(fToObj)
  return vObj.concat(fObj).join("\n")
}

const fileFormats = [
  {
    ext: "json",
    serializer: JSON.stringify,
  },
  {
    ext: "obj",
    serializer: toObj,
  },
]

interface Props {
  name: string
  solid: RawSolidData
}

function DownloadLink({
  ext,
  serializer,
  solid,
  name,
}: typeof fileFormats[0] & Props) {
  const filename = `${name}.${ext}`
  const blob = new Blob([serializer(solid)], {
    type: "text/plain;charset=utf-8",
  })
  const url = window.URL.createObjectURL(blob)

  const css = useStyle({
    display: "inline-flex",
    justifyContent: "center",
    padding: scales.spacing[2],
    width: scales.size[4],

    textDecoration: "none",
    border: "1px LightGray solid",
    color: "black",
    fontFamily: fonts.andaleMono,
    ...hover,

    ":not(:last-child)": {
      marginRight: scales.spacing[2],
    },
  })

  return (
    <a {...css()} key={ext} download={filename} href={url}>
      <SrOnly>Download as</SrOnly>.{ext}{" "}
      <span>
        <Icon path={mdiDownload} size={scales.size[1]} />
      </span>
    </a>
  )
}

export default function DataDownloader({ solid, name }: Props) {
  const heading = useStyle({
    fontFamily: fonts.times,
    fontSize: scales.font[4],
    marginBottom: scales.spacing[2],
  })
  return (
    <div>
      <h2 {...heading()}>Download model</h2>
      <div>
        {fileFormats.map((format) => (
          <DownloadLink
            key={format.ext}
            {...format}
            name={name}
            solid={solid}
          />
        ))}
      </div>
    </div>
  )
}
