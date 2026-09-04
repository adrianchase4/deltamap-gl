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
export interface MaplibreWorkerOptions {
    /** Asset directory inside the build output. Matches Vite's default. */
    assetsDir?: string;
    /**
     * Files to copy out of maplibre-gl/dist. The worker imports a shared chunk by
     * a relative path, so copying the worker alone gets you a second 404 one
     * level down.
     */
    files?: string[];
}
interface MinimalPlugin {
    name: string;
    apply: 'build';
    configResolved: (config: {
        build: {
            outDir: string;
            assetsDir: string;
        };
    }) => void;
    closeBundle: () => Promise<void>;
}
export declare function maplibreWorker(options?: MaplibreWorkerOptions): MinimalPlugin;
export {};
