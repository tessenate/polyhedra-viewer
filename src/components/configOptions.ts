import { startCase, set } from "lodash-es"

interface BaseConfigInput<T = any> {
  key: string
  type: string
  default: T
  options?: number[]
  display?: string
}

export interface ConfigInput<T = any> extends BaseConfigInput<T> {
  display: string
}

export const configInputs: ConfigInput[] = [
  {
    key: "showEdges",
    type: "checkbox",
    default: true,
  },
  {
    key: "showFaces",
    type: "checkbox",
    default: true,
  },
  {
    key: "showInnerFaces",
    type: "checkbox",
    default: true,
  },
  {
    key: "enableAnimation",
    type: "checkbox",
    default: true,
  },
  {
    key: "animationSpeed",
    type: "select",
    options: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2],
    default: 1,
  },
].map((input: BaseConfigInput) => ({
  ...input,
  display: input?.display ?? startCase(input.key),
}))

export const defaultConfig: Record<string, any> = configInputs.reduce(
  (obj, option) => set(obj, option.key, option.default),
  {},
)
