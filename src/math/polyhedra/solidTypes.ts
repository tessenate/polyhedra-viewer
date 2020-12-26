import { Point } from "types"
import { Vector3 } from "three"
export type VIndex = number
export type FIndex = number

type Edge = [VIndex, VIndex]
interface BaseSolidData<V> {
  vertices: V[]
  faces: VIndex[][]
  edges?: Edge[]
}

export type SolidData = BaseSolidData<Vector3>
export type RawSolidData = BaseSolidData<Point>
