export function isGenerator (obj: unknown): obj is Generator {
  if (obj == null) {
    return false
  }

  const iterator = (obj as { [Symbol.iterator]?: unknown })?.[Symbol.iterator]

  if (typeof iterator !== 'function') {
    return false
  }

  const instance = obj as { next?: unknown }

  return typeof instance.next === 'function'
}
