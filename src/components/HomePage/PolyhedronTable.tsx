import React, { ThHTMLAttributes } from "react"

import { Table } from "tables"
import { PolyhedronSpecs, getCanonicalSpecs } from "specs"
import PolyhedronLink from "./PolyhedronLink"
import { media, fonts, useStyle, scales } from "styles"

function useCellStyle() {
  return useStyle({
    fontFamily: fonts.times,
    verticalAlign: "middle",
    textAlign: "center",
    color: "DimGrey",
    [media.notMobile]: { fontSize: scales.font[7] },
    [media.mobile]: { fontSize: 8 },
  })
}

const Cell = ({
  cell,
  colSpan = 1,
}: {
  cell: PolyhedronSpecs | string
  colSpan?: number
}) => {
  const css = useCellStyle()
  const label = useStyle({ marginTop: scales.spacing[1] })
  if (typeof cell === "string") {
    return (
      <td {...css()} colSpan={colSpan}>
        {cell}
      </td>
    )
  }
  const canonical = getCanonicalSpecs(cell.canonicalName())
  const isDuplicate = !cell.equals(canonical)
  let symbol = canonical.conwaySymbol()
  if (isDuplicate) symbol = `(${symbol})`

  // Render a link for each cell, or a grayed-out link when indicated by an "!"
  return (
    <td {...css()} colSpan={colSpan}>
      {<PolyhedronLink isDuplicate={isDuplicate} specs={cell} />}
      <div {...label()}>{symbol}</div>
    </td>
  )
}

function Th(props: ThHTMLAttributes<Element>) {
  const css = useCellStyle()
  return <th {...props} {...css()} />
}

const ColumnHeaders = ({ columns }: Pick<Table, "columns">) => {
  return (
    <thead>
      {/* Render the subcolumn headers first, where they exist. */}
      <tr>
        <th />
        {columns.flatMap((col, j) =>
          typeof col === "string"
            ? [<th key={j} />]
            : col.sub.map((subCol) => <Th key={`${j}-${subCol}`}>{subCol}</Th>),
        )}
      </tr>
      {/* Render the main column headers, making sure to span more than one column for those with subcolumns */}
      <tr>
        <th />
        {columns.map((col, j) => (
          <Th key={j} colSpan={typeof col !== "string" ? col.sub.length : 1}>
            {typeof col !== "string" ? col.name : col}
          </Th>
        ))}
      </tr>
    </thead>
  )
}

type Props = Table

export default function PolyhedronTable({
  caption,
  rows,
  columns,
  data,
}: Props) {
  const css = useStyle({
    borderSpacing: scales.spacing[2],
    borderCollapse: "separate",
  })
  const captionCss = useStyle({
    fontSize: scales.font[5],
    fontFamily: fonts.times,
  })
  return (
    <table {...css()}>
      <caption {...captionCss()}>{caption}</caption>
      <ColumnHeaders columns={columns} />
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {/* Row header */}
            <Th>{rows[i]}</Th>
            {row.flatMap((cell, j) => {
              const col = columns[j]
              if (cell instanceof Array) {
                return cell.map((subcell, k) => (
                  <Cell key={`${j}-${k}`} cell={subcell} />
                ))
              }
              if (typeof col === "string") {
                return [<Cell key={j} cell={cell} />]
              }
              return [<Cell key={j} cell={cell} colSpan={col.sub.length} />]
              // If the cell does have subcells render and return them
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
