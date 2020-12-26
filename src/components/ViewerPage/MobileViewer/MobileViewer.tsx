import React, { memo } from "react"
import { CSSProperties } from "aphrodite"

import { useStyle, media, scales } from "styles"
import { scroll, paddingHoriz, flexRow } from "styles/common"
import {
  BackLink,
  Title,
  NavMenu,
  SolidScene,
  Panels,
  useHiddenHeading,
} from "../common"

import OperationsPanel from "./OperationsPanel"

const titleHeight = "3rem"

function mobile(styles: (navH: string) => CSSProperties) {
  return {
    [media.mobileLandscape]: styles("3rem"),
    [media.mobilePortrait]: styles(scales.size[3]),
  }
}

interface Props {
  panel: string
  solid: string
}

function Header({ solid }: Pick<Props, "solid">) {
  const css = useStyle({
    height: titleHeight,
    ...paddingHoriz(scales.spacing[2]),
    borderBottom: "1px solid LightGray",
    width: "100%",
    display: "grid",
    gridTemplateColumns: `${scales.size[2]} 1fr ${scales.size[2]}`,
    alignItems: "center",
    justifyItems: "center",
  })
  return (
    <header {...css()}>
      <BackLink solid={solid} />
      <Title name={solid} />
    </header>
  )
}

function Content({
  panel,
  header,
}: Pick<Props, "panel"> & { header: JSX.Element }) {
  const transparent = ["operations", "full"].includes(panel)
  const css = useStyle(
    {
      ...scroll("y"),
      gridArea: "content",
      position: "relative",
      zIndex: 100,
      ...(transparent
        ? { pointerEvents: "none" }
        : { backgroundColor: "rgba(255, 255, 255, 0.75)" }),
    },
    [transparent],
  )
  return (
    <div {...css()}>
      {header}
      <Panels panel={panel} operationsPanel={OperationsPanel} />
    </div>
  )
}

export default memo(function MobileViewer({ panel, solid }: Props) {
  const [header, focusOnHeader] = useHiddenHeading(panel)

  const css = useStyle({
    position: "relative",
    width: "100vw",
    height: "100vh",
    display: "grid",
    gridTemplateAreas: '"title" "content" "nav"',
    ...mobile((navH) => ({
      gridTemplateRows: `${titleHeight} 1fr ${navH}`,
    })),
  })

  const sceneCss = useStyle({
    ...mobile((navH) => ({
      height: `calc(100vh - ${navH} - ${titleHeight})`,
    })),
    zIndex: 0,
    gridArea: "content",
    position: "relative",
  })

  const navCss = useStyle({
    ...mobile((navH) => ({
      height: navH,
    })),
    ...flexRow("center"),
    gridArea: "nav",
    borderTop: "1px solid LightGray",
  })

  return (
    <section {...css()}>
      <Header solid={solid} />
      <Content panel={panel} header={header} />
      <main {...sceneCss()}>
        <SolidScene />
      </main>
      <div {...navCss()}>
        <NavMenu onClick={focusOnHeader} />
      </div>
    </section>
  )
})
