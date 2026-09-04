# deltamap-gl

[![npm](https://img.shields.io/npm/v/deltamap-gl.svg)](https://www.npmjs.com/package/deltamap-gl)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![types](https://img.shields.io/badge/types-included-blue.svg)](./src/types.ts)

Declarative [MapLibre](https://maplibre.org/) layers for urban climate work —
3D buildings at surveyed heights, tree crowns, sun-accurate cast shadows,
georeferenced rasters and choropleths, plus a small React UI kit.

You describe the layers you want. The package builds the MapLibre sources and
layers and hands the map back — it does not wrap MapLibre away.

```bash
npm install deltamap-gl maplibre-gl react
```

```tsx
import 'maplibre-gl/dist/maplibre-gl.css'
import { UrbanClimateMap, MapControls, LayerToggle } from 'deltamap-gl'

<UrbanClimateMap
  config={{
    centre: [144.9558, -37.8136],
    camera: { zoom: 15, pitch: 55 },
    sky: true,
    layers: [
      { kind: 'raster',    id: 'heat',  url: '/raster/lst.png', corners },
      { kind: 'buildings', id: 'blds',  data: '/data/buildings.geojson' },
      { kind: 'trees',     id: 'trees', data: '/data/trees.geojson' },
      { kind: 'shadows',   id: 'shade' },
    ],
  }}
>
  <MapControls />
  <LayerToggle options={[{ id: 'heat', label: 'Surface heat' }]} />
</UrbanClimateMap>
```

**[Full documentation →](./docs/index.html)** · **[Example app →](https://github.com/adrianchase4/shade-atlas)**

## Vite setup

MapLibre resolves its parser worker at runtime, so bundlers cannot trace it. The
symptom is nasty: the build succeeds, the basemap and rasters draw, and every
vector layer silently renders nothing. Two lines fix it.

```ts
import { maplibreWorker } from 'deltamap-gl/vite'

export default defineConfig({
  plugins: [react(), maplibreWorker()],
  optimizeDeps: { exclude: ['maplibre-gl'] },
})
```

## Layer kinds

| kind | draws |
|---|---|
| `buildings` | `fill-extrusion` from a height property, with a height colour ramp |
| `trees` | flat ground discs zoomed out, extruded trunk and crown zoomed in |
| `shadows` | ground shadows cast by tree crowns, from real solar position |
| `choropleth` | polygons coloured by one numeric property, hover and click wired |
| `raster` | a georeferenced image over four corners — no tile server needed |
| `fill` | a plain filled polygon layer |
| `ring` | a dashed circle, for the radius a measurement covers |

Layers draw in the order you list them.

## UI kit

`MapControls`, `LayerToggle`, `Legend`, `HoverReadout`, `SunControl`,
`StatusBar`, `Notice`, `Sidebar`, `Panel`, `Stat`, plus landing-page pieces
(`Hero`, `Section`, `InsightGrid`, `Reveal`, `CountUp`).

Each reads its state from `<UrbanClimateMap>`, so in an app they are one line
each. Components style themselves inline from a theme object — there is no CSS
file to import and no framework assumed.

## Bring your own field names

Nothing is hardcoded to one city. Defaults match City of Melbourne open data,
because a default that works for somebody beats one that works for nobody.

```ts
fields: { buildingHeight: 'height_m', treeSpecies: 'species', treeDbh: 'dbh_cm' }
```

## Three decisions worth knowing

**Every 3D layer is `fill-extrusion`.** MapLibre draws extrusions in one depth
pass so they occlude each other correctly. A `circle` layer is a screen-space
billboard that never depth-tests against buildings, so tree dots paint over
towers and appear to float through them.

**Trees swap render mode at zoom 16.** Extruded crowns are correct but cost
geometry. Only trees in the viewport are processed, capped by
`maxViewportTrees`.

**Rasters resample `nearest`.** Smoothing a 30 m measurement invents detail that
was never observed.

## Limits

- Geometry is equirectangular: fine across a few kilometres, wrong across tens.
- Solar dates use the viewer's timezone unless you build them with an offset.
- Crown radii from the built-in species table are display geometry, not a growth
  model — pass `crownRadius` if you have fitted curves.
- MapLibre loads sources eagerly, so a hidden layer still downloads its data.

## Requirements

`maplibre-gl >=4 <7`, `react >=18`. Tested against MapLibre 4.7 and 6.7.

MIT.
