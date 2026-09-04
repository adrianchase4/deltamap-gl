/**
 * Vite plugin: emit MapLibre's worker so a production build actually works.
 *
 * MapLibre resolves its parser worker at runtime with
 * `new URL(`./${name}`, import.meta.url)`. The filename is a variable, so
 * Rollup cannot trace it and never emits the file. The build succeeds, the page
 * loads, the basemap and any raster layers draw — and every vector source
 * silently fails, because parsing vector tiles and GeoJSON is exactly what the
 * worker does. Nothing in the console says "worker", only a 404 on a path you
 * did not write.
 *
 * Copying the worker beside the bundle is the whole fix.
 *
 *   // vite.config.ts
 *   import { maplibreWorker } from 'urban-climate-map/vite'
 *   export default defineConfig({ plugins: [react(), maplibreWorker()] })
 *
 * In dev, add `optimizeDeps: { exclude: ['maplibre-gl'] }` as well: the
 * pre-bundler rewrites the same import and leaves the worker behind.
 */

import { createRequire } from 'node:module'
import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'

export interface MaplibreWorkerOptions {
  /** Asset directory inside the build output. Matches Vite's default. */
  assetsDir?: string
  /**
   * Files to copy out of maplibre-gl/dist. The worker imports a shared chunk by
   * a relative path, so copying the worker alone gets you a second 404 one
   * level down.
   */
  files?: string[]
}

const WORKER_FILES = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']

interface MinimalPlugin {
  name: string
  apply: 'build'
  configResolved: (config: { build: { outDir: string; assetsDir: string } }) => void
  closeBundle: () => Promise<void>
}

export function maplibreWorker(options: MaplibreWorkerOptions = {}): MinimalPlugin {
  let outDir = 'dist'
  let assetsDir = options.assetsDir ?? 'assets'

  return {
    name: 'urban-climate-map:maplibre-worker',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
      assetsDir = options.assetsDir ?? config.build.assetsDir
    },
    async closeBundle() {
      // Resolve package.json rather than the package itself: maplibre-gl is
      // ESM-only with no `main`, so require.resolve('maplibre-gl') throws
      // ERR_PACKAGE_PATH_NOT_EXPORTED. `./package.json` is always exported.
      const require = createRequire(import.meta.url)
      const pkg = require.resolve('maplibre-gl/package.json')
      const dist = join(dirname(pkg), 'dist')
      const target = join(outDir, assetsDir)
      await mkdir(target, { recursive: true })

      for (const name of options.files ?? WORKER_FILES) {
        try {
          await copyFile(join(dist, name), join(target, name))
        } catch (cause) {
          throw new Error(
            `urban-climate-map: could not copy ${name} from ${dist}. ` +
            'Without it a production build renders no vector data.',
            { cause },
          )
        }
      }
    },
  }
}
