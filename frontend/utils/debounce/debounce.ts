export const debounce = <F extends (...args: never[]) => unknown>(fn: F, wait = 400) => {
  let t: ReturnType<typeof setTimeout>
  return (...args: Parameters<F>) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), wait)
  }
}