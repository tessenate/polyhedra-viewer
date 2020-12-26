import { forEach } from "lodash-es"
import { fromSpecs } from "math/formes"
import { operations } from ".."
import { validateOperationApplication } from "../operationTestUtils"

describe("applyOperation", () => {
  forEach(operations, (operation, opName) => {
    describe(opName, () => {
      // TODO determine solid names from the graph instead
      for (const specs of operation.allInputs()) {
        const polyhedron = fromSpecs(specs)
        if (operation.canApplyTo(polyhedron)) {
          it(polyhedron.specs.name(), () => {
            for (const options of operation.allOptionCombos(polyhedron)) {
              validateOperationApplication(operation, polyhedron, options)
            }
          })
        }
      }
    })
  })
})
