import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';

/**
 * DrawControl — integrates Leaflet.Draw into a react-leaflet MapContainer.
 *
 * Props:
 *  onPolygonComplete(latlngs: [lat, lng][]) — fired when user finishes drawing a polygon
 *  drawnLayerRef — external ref that holds the current drawn layer so parent can clear it
 */
export default function DrawControl({ onPolygonComplete, drawnLayerRef }) {
    const map = useMap();
    const featureGroupRef = useRef(null);
    const controlRef = useRef(null);

    useEffect(() => {
        // Create a FeatureGroup to hold drawn shapes
        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
        featureGroupRef.current = drawnItems;

        // Expose to parent for clearing
        if (drawnLayerRef) {
            drawnLayerRef.current = drawnItems;
        }

        // Initialise Leaflet.Draw control (polygon only)
        const drawControl = new L.Control.Draw({
            position: 'topleft',
            draw: {
                polygon: {
                    allowIntersection: false,
                    showArea: true,
                    shapeOptions: {
                        color: '#6366f1',
                        fillColor: '#6366f1',
                        fillOpacity: 0.15,
                        weight: 2,
                    },
                },
                polyline: false,
                rectangle: false,
                circle: false,
                circlemarker: false,
                marker: false,
            },
            edit: {
                featureGroup: drawnItems,
                remove: true,
            },
        });

        map.addControl(drawControl);
        controlRef.current = drawControl;

        // Handler: polygon created
        const onCreate = (e) => {
            // Clear previous drawing
            drawnItems.clearLayers();
            drawnItems.addLayer(e.layer);

            const latlngs = e.layer.getLatLngs()[0].map((ll) => [ll.lat, ll.lng]);
            onPolygonComplete(latlngs);
        };

        // Handler: layer deleted
        const onDelete = () => {
            onPolygonComplete(null);
        };

        map.on(L.Draw.Event.CREATED, onCreate);
        map.on(L.Draw.Event.DELETED, onDelete);

        return () => {
            map.off(L.Draw.Event.CREATED, onCreate);
            map.off(L.Draw.Event.DELETED, onDelete);
            map.removeControl(drawControl);
            map.removeLayer(drawnItems);
        };
    }, [map]); // eslint-disable-line react-hooks/exhaustive-deps

    return null;
}
