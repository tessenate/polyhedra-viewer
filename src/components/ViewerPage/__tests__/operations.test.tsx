import React from "react"
import {
  render,
  screen,
  fireEvent,
  createEvent,
  getByTestId,
} from "@testing-library/react"
import { Polyhedron, Face } from "math/polyhedra"
import { Point } from "types"

import { MemoryRouter, Routes, Route } from "react-router-dom"
import ViewerPage from "../ViewerPage"

jest.mock("transition")

function splitListOfLists(listStr: string, outerSep: string, innerSep: string) {
  return listStr
    .split(outerSep)
    .map((inner) => inner.split(innerSep).map(parseFloat))
}

function renderViewer(solid: string) {
  return render(
    <MemoryRouter initialEntries={[`/${solid}/operations`]}>
      <Routes>
        <Route path=":solid/*" element={<ViewerPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function clickOperation(operation: string) {
  fireEvent.click(screen.getByText(operation))
}

function getPolyhedron() {
  const shapeNode = screen.getByTestId("x3d-shape")
  const faceStr = getByTestId(shapeNode, "x3d-faces").getAttribute(
    "coordindex",
  )!
  const vertexStr = getByTestId(shapeNode, "x3d-vertices").getAttribute(
    "point",
  )!
  const vertices = splitListOfLists(vertexStr, ", ", " ") as Point[]
  const faces = splitListOfLists(faceStr, " -1 ", " ")
  const name = screen.getByTestId("viewer-title").textContent!.toLowerCase()
  return new Polyhedron({ name, vertices, faces })
}

function fireX3dEvent(
  node: HTMLElement,
  eventName: keyof typeof createEvent,
  hitPnt: Point,
) {
  const event: any = createEvent[eventName](node)
  event.hitPnt = hitPnt
  fireEvent(node, event)
}

function clickFace(face: Face) {
  const hitPnt = face.centroid().toArray()
  const shapeNode = screen.getByTestId("x3d-shape")
  fireX3dEvent(shapeNode, "mouseDown", hitPnt)
  fireX3dEvent(shapeNode, "mouseUp", hitPnt)
}

function clickFaceWithNumSides(n: number) {
  clickFace(getPolyhedron().faceWithNumSides(n))
}

describe("Viewer operations panel", () => {
  it("disables operations that cannot be applied to the current polyhedron", () => {
    renderViewer("tetrahedron")
    expect(screen.queryByText("diminish")).toBeDisabled()
  })

  it("unsets the operation when clicking an op button twice", () => {
    renderViewer("tetrahedron")
    clickOperation("augment")
    clickOperation("augment")
    expect(screen.queryByText("Select a face")).not.toBeInTheDocument()
  })

  it("immediately applies operations without options", () => {
    renderViewer("tetrahedron")
    clickOperation("elongate")
    expect(
      screen.queryByText("Elongated triangular pyramid"),
    ).toBeInTheDocument()
  })

  it("unsets the operation and options when choosing a different operation without options", () => {
    renderViewer("tetrahedron")
    clickOperation("augment")
    clickOperation("elongate")
    expect(screen.queryByText("Select a face")).not.toBeInTheDocument()
  })

  it("does not apply the operation when clicking an invalid face", () => {
    renderViewer("augmented-truncated-tetrahedron")
    clickOperation("diminish")
    clickFaceWithNumSides(6)
    expect(screen.queryByText("Select a component")).toBeInTheDocument()
  })

  it("unsets the operation and options when there are no more valid options", () => {
    renderViewer("cuboctahedron")
    clickOperation("sharpen")
    clickFaceWithNumSides(4)
    expect(screen.queryByText("Octahedron")).toBeInTheDocument()
    expect(screen.queryByText("Select a type of face")).not.toBeInTheDocument()
  })

  it("unsets the operation when clicking on a different tab", () => {
    renderViewer("tetrahedron")
    clickOperation("augment")
    fireEvent.click(screen.getByText("Options"))
    fireEvent.click(screen.getByText("Operations"))
    expect(screen.queryByText("Select a face")).not.toBeInTheDocument()
  })

  // should just be a test that twist options appear
  it("correctly displays twist operations", () => {
    renderViewer("icosahedron")
    clickOperation("snub")
    expect(screen.queryByText("left")).toBeInTheDocument()
    expect(screen.queryByText("right")).toBeInTheDocument()
    // TODO apply the operation
    // TODO better for `turn` which gives different polyhedra options
  })

  describe("augment options", () => {
    it("correctly displays gyrate options", () => {
      renderViewer("triangular cupola")
      clickOperation("augment")
      expect(screen.queryByText("ortho")).toBeInTheDocument()
      expect(screen.queryByText("gyro")).toBeInTheDocument()
      // TODO click on one of them and make sure it's selected
    })

    it("does not display gyrate options when unavailable", () => {
      renderViewer("square pyramid")
      clickOperation("augment")
      expect(screen.queryByText("ortho")).not.toBeInTheDocument()
      expect(screen.queryByText("gyro")).not.toBeInTheDocument()
    })

    it("correctly displays using options for cupola-rotundae", () => {
      renderViewer("pentagonal cupola")
      clickOperation("augment")
      expect(screen.queryByText("cupola")).toBeInTheDocument()
      expect(screen.queryByText("rotunda")).toBeInTheDocument()
      // TODO apply operation
    })

    it("correctly displays using options for the fastigium", () => {
      renderViewer("triangular prism")
      clickOperation("augment")
      expect(screen.queryByText("pyramid")).toBeInTheDocument()
      expect(screen.queryByText("fastigium")).toBeInTheDocument()
      // TODO apply operation
    })

    it("does not display using options when unavailable", () => {
      renderViewer("triangular cupola")
      clickOperation("augment")
      expect(screen.queryByText("cupola")).not.toBeInTheDocument()
      expect(screen.queryByText("rotunda")).not.toBeInTheDocument()
    })
  })
})
