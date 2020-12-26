import { zip } from "lodash-es"
import { SolidData } from "math/polyhedra"
import React, { useRef, useMemo } from "react"
import {
  Color,
  Vector3,
  BufferAttribute,
  DoubleSide,
  Face3,
  BufferGeometry,
  FrontSide,
  Geometry,
} from "three"
import { Appearance } from "./getFormeColors"
import { useFrame, useUpdate } from "react-three-fiber"

function convertFace(face: number[], appearance: Appearance) {
  const [v0, ...vs] = face
  const pairs = zip(vs.slice(0, vs.length - 1), vs.slice(1))
  const { color, material } = appearance
  return pairs.map(([v1, v2]) => {
    if (color instanceof Color) {
      return new Face3(v0, v1!, v2!, undefined, color, material)
    } else {
      const colorArray = [v0, v1!, v2!].map((v) => color[face.indexOf(v)])
      return new Face3(v0, v1!, v2!, undefined, colorArray, material)
    }
  })
}

function convertFaces(faces: number[][], colors: Appearance[]) {
  return zip(faces, colors).flatMap(([face, color]) =>
    convertFace(face!, color!),
  )
}

interface SolidConfig {
  showFaces: boolean
  showEdges: boolean
  showInnerFaces: boolean
}

interface Props {
  value: SolidData
  appearance: Appearance[]
  config: SolidConfig
  onClick?(point: Vector3): void
  onPointerMove?(point: Vector3): void
  onPointerOut?(point: Vector3): void
}

function SolidFaces({
  value,
  appearance,
  onClick,
  onPointerMove,
  onPointerOut,
  config,
}: Props) {
  const { vertices, faces } = value
  const ref = useUpdate(
    (geom: Geometry) => {
      geom.vertices = vertices
      geom.verticesNeedUpdate = true
      geom.faces = convertFaces(faces, appearance)
      geom.elementsNeedUpdate = true
      geom.colorsNeedUpdate = true
      geom.computeFaceNormals()
    },
    [vertices, faces, appearance],
  )

  const hasMoved = useRef(false)
  const { showFaces, showInnerFaces } = config
  return (
    <mesh
      visible={showFaces}
      onPointerDown={(e) => {
        hasMoved.current = false
      }}
      onPointerUp={(e) => {
        if (hasMoved.current) return
        onClick?.(e.point)
      }}
      onPointerMove={(e) => {
        hasMoved.current = true
        onPointerMove?.(e.point)
      }}
      onPointerOut={(e) => {
        onPointerOut?.(e.point)
      }}
    >
      <geometry ref={ref} attach="geometry" />
      <meshLambertMaterial
        side={showInnerFaces ? DoubleSide : FrontSide}
        attachArray="material"
        args={[{ vertexColors: true }]}
      />
      <meshStandardMaterial
        side={showInnerFaces ? DoubleSide : FrontSide}
        attachArray="material"
        args={[{ vertexColors: true }]}
        transparent
        opacity={7 / 8}
      />
    </mesh>
  )
}

function SolidEdges({ value, config }: Props) {
  const { vertices, edges = [] } = value
  const { showEdges } = config

  const edgeGeom = useMemo(() => {
    const geom = new BufferGeometry()
    const positions = new Float32Array(300 * 3) // 3 vertices per point
    geom.setAttribute("position", new BufferAttribute(positions, 3))
    return geom
  }, [])

  useFrame(() => {
    const positions = edgeGeom.attributes.position.array as number[]
    edges.forEach((edge: [number, number], i: number) => {
      const [i1, i2] = edge
      // Scale edges slightly so they don't overlap
      // TODO do this in a way that doesn't rely on it being centered
      const vs = [
        ...vertices[i1].clone().multiplyScalar(1.001).toArray(),
        ...vertices[i2].clone().multiplyScalar(1.001).toArray(),
      ]
      for (let j = 0; j < 6; j++) {
        positions[i * 6 + j] = vs[j]
      }
    })
    edgeGeom.setDrawRange(0, edges.length * 2)
    ;(edgeGeom.attributes.position as any).needsUpdate = true
  })

  return (
    <lineSegments geometry={edgeGeom}>
      <lineBasicMaterial
        attach="material"
        color={0x555555}
        linewidth={1}
        transparent
        visible={showEdges}
        opacity={0.5}
      />
    </lineSegments>
  )
}

export default function PolyhedronModel(props: Props) {
  return (
    <group>
      <SolidFaces {...props} />
      <SolidEdges {...props} />
    </group>
  )
}
