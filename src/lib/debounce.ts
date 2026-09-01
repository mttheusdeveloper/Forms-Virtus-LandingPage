export function debounce<Args extends unknown[]>(fn: (...args: Args) => void, delay = 120): (...args: Args) => void {
  let t: ReturnType<typeof setTimeout>;
  return (...args: Args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}
