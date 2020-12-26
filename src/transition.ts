import * as d3 from "d3-ease"

export interface TransitionOptions {
  duration: number
  ease: keyof typeof d3
  onFinish(): void
}

export type Callback = (val: number) => void

/**
 * An animation function based on d3's interpolate.
 * @returns an cancel() function
 */
export default function transition(
  options: TransitionOptions,
  updateCallback: Callback,
) {
  const {
    // Duration, in milliseconds
    duration,
    ease,
    onFinish,
  } = options
  let start = 0
  const id: { current?: number } = {}
  // Adapted from:
  // https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
  const step = (timestamp: number) => {
    if (!start) {
      start = timestamp
    }
    const delta = timestamp - start
    const progress = Math.min(delta / duration, 1)
    updateCallback(d3[ease](progress))
    if (delta < duration) {
      id.current = requestAnimationFrame(step)
    } else {
      onFinish?.()
    }
  }
  id.current = requestAnimationFrame(step)
  return {
    cancel() {
      cancelAnimationFrame(id.current!)
    },
  }
}
