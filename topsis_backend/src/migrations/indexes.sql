CREATE INDEX idx_locations_geom
ON locations
USING GIST (geom);

CREATE INDEX idx_locations_lat
ON locations(lat);

CREATE INDEX idx_locations_lng
ON locations(lng);