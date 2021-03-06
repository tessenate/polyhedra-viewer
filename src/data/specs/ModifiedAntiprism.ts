import { Items } from "types"
import Specs from "./PolyhedronSpecs"
import Queries from "./Queries"
import Prismatic from "./Prismatic"

const sources = Prismatic.query.where(
  (s) => s.isAntiprism() && !s.isSecondary(),
)
const operations = [null, "snub"] as const
type Operation = Items<typeof operations>

interface ModifiedAntiprismData {
  source: Prismatic
  // operation: null | "rectified" | "snub"
  operation: Operation
}

export default class ModifiedAntiprism extends Specs<ModifiedAntiprismData> {
  constructor(data: ModifiedAntiprismData) {
    super("modified antiprism", data)
  }

  static *getAll() {
    for (const source of sources) {
      for (const operation of operations) {
        // The snub pentagonal antiprism is non-CRF
        if (source.data.base === 5 && operation === "snub") {
          continue
        }
        yield new ModifiedAntiprism({ source, operation })
      }
    }
  }

  static query = new Queries(ModifiedAntiprism.getAll())
}
