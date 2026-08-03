import 'leaflet'

declare module 'leaflet' {
  interface MarkerClusterGroupOptions {
    maxClusterRadius?: number | ((zoom: number) => number)
    iconCreateFunction?: (cluster: MarkerCluster) => Icon | DivIcon
    clusterPane?: string
    spiderfyOnEveryZoom?: boolean
    spiderfyOnMaxZoom?: boolean
    showCoverageOnHover?: boolean
    zoomToBoundsOnClick?: boolean
    singleMarkerMode?: boolean
    disableClusteringAtZoom?: number | null
    removeOutsideVisibleBounds?: boolean
    animate?: boolean
    animateAddingMarkers?: boolean
    spiderfyDistanceMultiplier?: number
    spiderLegPolylineOptions?: PolylineOptions
    chunkedLoading?: boolean
    polygonOptions?: PolylineOptions
  }

  class MarkerCluster extends Marker {
    getChildCount(): number
    getAllChildMarkers(): Marker[]
    spiderfy(): void
    unspiderfy(): void
    zoomToBounds(options?: FitBoundsOptions): void
  }

  class MarkerClusterGroup extends FeatureGroup {
    constructor(options?: MarkerClusterGroupOptions)
    addLayer(layer: Layer): this
    removeLayer(layer: Layer): this
    clearLayers(): this
    hasLayer(layer: Layer): boolean
    refreshClusters(layers?: Layer | Layer[] | MarkerClusterGroup): this
    zoomToShowLayer(layer: Layer, callback?: () => void): void
  }

  function markerClusterGroup(options?: MarkerClusterGroupOptions): MarkerClusterGroup
}

declare module '*leaflet.markercluster.js' {
  const _: unknown
  export default _
}
