# urban-climate-map

Declarative [MapLibre](https://maplibre.org/) layers for urban climate work:
3D buildings at surveyed heights, tree crowns, sun-accurate cast shadows,
georeferenced rasters and choropleths.

You describe the layers you want. The package builds the MapLibre sources and
layers, and hands you back the map so you can still do anything MapLibre can do.

```tsx
import { useMapInstance, type UrbanMapConfig } from 'urban-climate-map'

const config: UrbanMapConfig = {
  centre: [144.9558, -37.8136],
  layers: [
    { kind: 'raster',    id: 'heat',  url: '/raster/lst.png', corners },
    { kind: 'buildings', id: 'blds',  data: '/data/buildings.geojson' },
    { kind: 'trees',     id: 'trees', data: '/data/trees.geojson' },
    { kind: 'shadows',   id: 'shade' },
  ],
}

const { map, ready, zoom, bearing } = useMapInstance({ container, config })
```

## Layer kinds

| kind | what it draws |
|---|---|
| `buildings` | `fill-extrusion` from a height property, with a height colour ramp |
| `trees` | flat ground discs when zoomed out, extruded trunk + crown when zoomed in |
| `shadows` | ground shadows cast by tree crowns, driven by real solar position |
| `choropleth` | polygons coloured by one numeric property, with optional outline |
| `raster` | a single georeferenced image stretched over four corners |
| `fill` | a plain filled polygon layer |
| `ring` | a dashed circle, for showing the radius a measurement covers |

Layers draw in the order you list them.

## Bring your own field names

Nothing is hardcoded to one city's schema. Defaults match City of Melbourne
open data because a default that works for somebody beats one that works for
nobody — override what differs:

```ts
fields: {
  buildingHeight: 'height_m',
  treeSpecies: 'species',
  treeDbh: 'trunk_dbh_cm',
}
```

Several layers can share one source, so boundaries are loaded once:

```ts
{ kind: 'choropleth', id: 'canopy', sourceId: 'areas', data: areas, field: 'canopy_pct', ramp },
{ kind: 'choropleth', id: 'heat',   sourceId: 'areas', data: areas, field: 'uhi',        ramp },
```

## Three decisions worth knowing

**Every 3D layer is `fill-extrusion`.** MapLibre draws extrusions in one depth
pass, so they occlude each other correctly. A `circle` layer is a screen-space
billboard: it never depth-tests against buildings, so tree dots paint over
towers and appear to float through them. Shadows are a 0.4 m extrusion for the
same reason — a flat `fill` would paint across roofs no tree could shade.

**Trees swap render mode at zoom 16.** Extruded crowns are correct but cost
geometry. Below the threshold you get cheap discs; above it, real 3D. Only trees
in the viewport are processed, capped by `maxViewportTrees`.

**Rasters use one image, not tiles.** A 30 m surface over a city is a few hundred
pixels a side — one PNG and four corner coordinates, no tile server. Resampling
is `nearest`, because smoothing invents detail the measurement does not have.
Past a few thousand pixels a side, use real tiles instead.

## Caveats

- Geometry is equirectangular, which is fine across a few kilometres and wrong
  across tens. Do not use it near the poles.
- `Date` objects for sun position are built in the *viewer's* timezone. A map of
  Melbourne viewed from London puts the sun in the wrong place unless you
  construct dates with an explicit offset.
- Crown radii from the built-in species table are display geometry, not a growth
  model. If you have fitted curves, pass `radiusOverride`.

## Install

```
npm install urban-climate-map maplibre-gl react
```

Peers: `maplibre-gl >=4 <7`, `react >=18`. Tested against both 4.7 and 6.7.

MIT.
