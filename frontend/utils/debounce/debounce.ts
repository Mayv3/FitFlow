export const debounce = <F extends (...args: any[]) => any>(fn: F, wait = 400) => {
  let t: any
  return (...args: Parameters<F>) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), wait)
  }
}