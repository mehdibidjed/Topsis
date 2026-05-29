import { useEffect, useState, useCallback } from 'react';
import { useMapEvents, FeatureGroup, Polygon, Polyline, CircleMarker } from 'react-leaflet';

/**
 * Internal click-listener. Active only while drawing mode is on.
 */
function ClickHandler({ active, onNewPoint }) {
    useMapEvents({
        click(e) {
            if (!active) return;
            onNewPoint([e.latlng.lat, e.latlng.lng]);
        }
    });
    return null;
}

/**
 * Pure drawing engine — no buttons rendered here.
 * Exposes { drawing, points, startDrawing, deleteLast, cancel } via onStateChange
 * so the parent (Dashboard) can render controls wherever it wants.
 */
export default function DrawControl({ onPolygonComplete, drawnLayerRef, onStateChange }) {
    const [points, setPoints] = useState([]);
    const [drawing, setDrawing] = useState(false);

    const isComplete = points.length === 4;

    const startDrawing = useCallback(() => {
        setPoints([]);
        setDrawing(true);
    }, []);

    const deleteLast = useCallback(() => {
        setPoints(prev => prev.slice(0, -1));
    }, []);

    const cancel = useCallback(() => {
        setPoints([]);
        setDrawing(false);
    }, []);

    const handleNewPoint = useCallback((pt) => {
        setPoints(prev => {
            const next = [...prev, pt];
            if (next.length === 4) {
                setDrawing(false);
                onPolygonComplete(next);
            }
            return next;
        });
    }, [onPolygonComplete]);

    // Push state up to Dashboard for button rendering
    useEffect(() => {
        onStateChange?.({ drawing, points, startDrawing, deleteLast, cancel });
    }, [drawing, points, startDrawing, deleteLast, cancel, onStateChange]);

    // Crosshair cursor while drawing
    useEffect(() => {
        const mapEl = document.querySelector('.leaflet-container');
        if (!mapEl) return;
        mapEl.style.cursor = drawing ? 'crosshair' : '';
    }, [drawing]);

    // Expose clearLayers to parent Reset button
    useEffect(() => {
        if (drawnLayerRef) {
            drawnLayerRef.current = {
                clearLayers: () => {
                    setPoints([]);
                    setDrawing(false);
                }
            };
        }
    }, [drawnLayerRef]);

    return (
        <>
            <ClickHandler active={drawing && !isComplete} onNewPoint={handleNewPoint} />
            <FeatureGroup>
                {points.map((p, i) => (
                    <CircleMarker key={i} center={p} radius={6}
                        pathOptions={{ color: '#fff', weight: 2, fillColor: '#6366f1', fillOpacity: 1 }}
                    />
                ))}
                {drawing && points.length > 1 && !isComplete && (
                    <Polyline positions={points}
                        pathOptions={{ color: '#6366f1', weight: 2.5, dashArray: '7 5', opacity: 0.85 }}
                    />
                )}
                {isComplete && (
                    <Polygon positions={points}
                        pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.18, weight: 2.5 }}
                    />
                )}
            </FeatureGroup>
        </>
    );
}
