export function isAsyncGenerator (obj: unknown): obj is AsyncGenerator {
  if (obj == null) {
    return false
  }

  const asyncIterator = (obj as { [Symbol.asyncIterator]?: unknown })?.[
    Symbol.asyncIterator
  ]

  if (typeof asyncIterator !== 'function') {
    return false
  }

  const instance = obj as { next?: unknown }
  return typeof instance.next === 'function'
}
