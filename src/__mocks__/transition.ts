import { Callback, TransitionOptions } from "../transition"

export default <T extends object>(
  { onFinish }: TransitionOptions,
  onUpdate: Callback,
) => {
  onUpdate(0)
  onUpdate(0.5)
  onUpdate(1)
  onFinish()
}
