import L from 'leaflet'

// UMDـی leaflet.markercluster پێویستی بە Lـی گشتی هەیە
;(globalThis as unknown as { L: typeof L }).L = L
