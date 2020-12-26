import { createHookedContext } from "components/common"
import { getSpecs } from "specs"
import { PolyhedronForme, createForme, fromSpecs } from "math/formes"

const defaultProps = { name: "tetrahedron" }
export default createHookedContext<
  PolyhedronForme,
  "setPolyhedron" | "setPolyhedronToName"
>(
  {
    setPolyhedron: (forme) => () => forme,
    setPolyhedronToName: (name) => (current) => {
      const specs = getSpecs(name)
      if (current.specs.canonicalName() === specs.canonicalName()) {
        return createForme(specs, current.geom)
      }
      return fromSpecs(specs)
    },
  },
  ({ name } = defaultProps) => {
    return fromSpecs(getSpecs(name))
  },
)
