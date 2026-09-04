/**
 * Fetch JSON once, with loading and error state. Aborts on unmount, so
 * navigating mid-download cannot set state on a component that has gone.
 */

import { useEffect, useState } from 'react'
import type { TreeCollection } from '../crowns'

export interface RemoteJson<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useRemoteJson<T>(url: string | null): RemoteJson<T> {
  const [state, setState] = useState<RemoteJson<T>>({
    data: null, loading: Boolean(url), error: null,
  })

  useEffect(() => {
    if (!url) {
      setState({ data: null, loading: false, error: null })
      return
    }
    const abort = new AbortController()
    setState({ data: null, loading: true, error: null })

    fetch(url, { signal: abort.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
        return response.json() as Promise<T>
      })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error: unknown) => {
        // An abort is a normal unmount, not a failure worth reporting.
        if (error instanceof DOMException && error.name === 'AbortError') return
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error.message : 'failed to load',
        })
      })

    return () => abort.abort()
  }, [url])

  return state
}

/** Same thing, typed for the point collection the tree layers expect. */
export function useTreeData(url: string | null): RemoteJson<TreeCollection> {
  return useRemoteJson<TreeCollection>(url)
}
