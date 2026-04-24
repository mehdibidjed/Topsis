import { useRef, forwardRef, useImperativeHandle } from 'react';
import {
    MapContainer,
    TileLayer,
    CircleMarker,
    Popup,
    useMap,
} from 'react-leaflet';
import DrawControl from './DrawControl';

/* ── Helpers ── */
const ORAN_CENTER = [35.69, -0.63];
const DEFAULT_ZOOM = 11;

function getScoreColor(score) {
    if (score >= 0.7) return '#22c55e'; // green
    if (score >= 0.4) return '#f97316'; // orange
    return '#ef4444';                    // red
}

function getScoreLabel(score) {
    if (score >= 0.7) return 'High';
    if (score >= 0.4) return 'Medium';
    return 'Low';
}

/* ── Inner component that has access to the map instance ── */
function FlyToController({ flyToRef }) {
    const map = useMap();

    useImperativeHandle(flyToRef, () => ({
        flyTo(lat, lng) {
            map.flyTo([lat, lng], 14, { duration: 1.2 });
        },
    }));

    return null;
}

/* ── Result markers layer ── */
function ResultMarkers({ results }) {
    return results.map((item, idx) => {
        const isBest = item.rank === 1;
        const color = getScoreColor(item.score);

        return (
            <CircleMarker
                key={idx}
                center={[item.lat, item.lng]}
                radius={isBest ? 12 : 8}
                pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: isBest ? 0.95 : 0.75,
                    weight: isBest ? 3 : 1.5,
                }}
            >
                <Popup>
                    <div className="min-w-[180px]">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-3">
                            <span
                                className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white"
                                style={{ backgroundColor: color }}
                            >
                                #{item.rank}
                            </span>
                            <div>
                                <p className="text-xs text-slate-400 leading-none">TOPSIS Score</p>
                                <p className="font-bold text-base" style={{ color }}>
                                    {item.score.toFixed(4)}
                                </p>
                            </div>
                            <span
                                className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ backgroundColor: `${color}22`, color }}
                            >
                                {getScoreLabel(item.score)}
                            </span>
                        </div>

                        {/* Metrics grid */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                            {[
                                { label: 'Wind', value: item.wind, unit: 'm/s' },
                                { label: 'Slope', value: item.slope, unit: '°' },
                                { label: 'Altitude', value: item.altitude, unit: 'm' },
                                { label: 'Habitations', value: item.habitations, unit: '' },
                            ].map(({ label, value, unit }) => (
                                <div key={label}>
                                    <span className="text-slate-400 text-xs">{label}</span>
                                    <p className="font-semibold text-slate-100 text-sm">
                                        {typeof value === 'number' ? value.toFixed(2) : value ?? '—'}{unit}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </Popup>
            </CircleMarker>
        );
    });
}

/* ── Main MapView component ── */
const MapView = forwardRef(function MapView(
    { results, onPolygonComplete, drawnLayerRef },
    ref
) {
    const flyToRef = useRef(null);

    // Expose flyTo to parent via ref
    useImperativeHandle(ref, () => ({
        flyTo(lat, lng) {
            flyToRef.current?.flyTo(lat, lng);
        },
    }));

    return (
        <MapContainer
            center={ORAN_CENTER}
            zoom={DEFAULT_ZOOM}
            className="w-full h-full"
            zoomControl={true}
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                maxZoom={19}
            />

            <FlyToController flyToRef={flyToRef} />

            <DrawControl
                onPolygonComplete={onPolygonComplete}
                drawnLayerRef={drawnLayerRef}
            />

            {results.length > 0 && <ResultMarkers results={results} />}
        </MapContainer>
    );
});

export default MapView;
