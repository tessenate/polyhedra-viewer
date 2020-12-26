import Classical from "./Classical"
import Capstone from "./Capstone"
import Composite from "./Composite"
import Elementary from "./Elementary"

const subclasses = [Classical, Capstone, Composite, Elementary]

export function getCanonicalSpecs(name: string) {
  for (const Subclass of subclasses) {
    if (Subclass.query.hasCanonicalName(name)) {
      return Subclass.query.withCanonicalName(name)
    }
  }
  throw new Error(`Could not find structure with canonical name ${name}`)
}

export function getSpecs(name: string) {
  for (const Subclass of subclasses) {
    if (Subclass.query.hasName(name)) {
      // TODO this might cause unanticipated errors for chiral polyhedra
      return Subclass.query.withName(name)
    }
  }
  throw new Error(`Could not find structure with name ${name}`)
}
