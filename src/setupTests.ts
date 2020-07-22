import "@testing-library/jest-dom"
import { configure } from "enzyme"
import Adapter from "enzyme-adapter-react-16"
import { StyleSheetTestUtils } from "aphrodite"
import "jest-extended"

configure({ adapter: new Adapter() })
StyleSheetTestUtils.suppressStyleInjection()

jest.mock("x3domWrapper.ts")
