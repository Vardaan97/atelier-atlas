export interface GeoFeature {
  type: 'Feature';
  properties: {
    NAME: string;
    ISO_A3: string;
    ISO_A2: string;
    CONTINENT: string;
    SUBREGION: string;
    POP_EST: number;
    GDP_MD: number;
    [key: string]: unknown;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

export interface GeoJSON {
  type: 'FeatureCollection';
  features: GeoFeature[];
}

export interface GlobeInteraction {
  type: 'click' | 'hover' | 'zoom';
  iso: string;
  coordinates: [number, number];
  feature?: GeoFeature;
}

export interface GlobeViewState {
  lat: number;
  lng: number;
  altitude: number;
}

export interface TooltipData {
  iso: string;
  name: string;
  flag: string;
  value: number;
  metric: string;
  x: number;
  y: number;
}

export interface GlobeOverlay {
  id: string;
  name: string;
  description: string;
  colorScale: (value: number) => string;
  getValue: (iso: string) => number;
}
