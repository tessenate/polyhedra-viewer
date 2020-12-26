import { ReactNode } from "react"

/** Items of an array */
export type Items<T extends readonly any[]> = T[number]

/** Type representing a point in 3D space */
export type Point = [number, number, number]

/** Children prop */
export interface ChildrenProp<T = ReactNode> {
  children?: T
}
