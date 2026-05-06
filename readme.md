GIS-Based TOPSIS Decision Support System
A geospatial decision-support system built with Node.js, PostgreSQL/PostGIS, OpenStreetMap, and TOPSIS multicriteria analysis to identify optimal geographic locations based on environmental and spatial criteria.

Project Overview
This project aims to analyze and rank geographic areas using a Multi-Criteria Decision-Making (MCDM) approach.
The system:


Generates geographic grid points over a selected region


Enriches each point with environmental and spatial data


Stores data in a PostGIS spatial database


Applies the TOPSIS algorithm


Returns ranked optimal locations


Visualizes results on an interactive map


The project was developed for spatial analysis and intelligent geographic decision support.

Technologies Used
Backend


Node.js


Express.js


PostgreSQL


PostGIS


node-fetch


pg


Spatial Data


OpenStreetMap (OSM)


osm2pgsql


APIs


Open-Meteo API


Wind speed


Elevation




Frontend


React JSX


TailwindCSS 3.4


Leaflet.js


React-Leaflet



System Architecture
Frontend (React + Leaflet)        ↓REST API (Express.js)        ↓TOPSIS Engine        ↓PostgreSQL + PostGIS        ↓OSM Spatial Data + External APIs

Features


Geographic grid generation


Spatial database management


Building density analysis


Elevation retrieval


Terrain slope computation


Wind analysis


Exposure calculation


TOPSIS multicriteria ranking


Interactive GIS dashboard


Dynamic weight selection


Ranked candidate locations


Spatial filtering and map visualization



Database Setup
1. Install PostgreSQL and PostGIS
Ubuntu:
sudo apt updatesudo apt install postgresql postgresql-contrib postgis

Create Database
Open PostgreSQL terminal:
sudo -u postgres psql
Create database:
CREATE DATABASE gis_db;
Connect to database:
\c gis_db
Enable PostGIS:
CREATE EXTENSION postgis;
Verify extensions:
\dx

Create Locations Table
CREATE TABLE locations (    id SERIAL PRIMARY KEY,    lat DOUBLE PRECISION,    lng DOUBLE PRECISION,    geom geometry(Point, 4326),    vent DOUBLE PRECISION,    pente DOUBLE PRECISION,    habitations DOUBLE PRECISION,    exposition DOUBLE PRECISION,    altitude DOUBLE PRECISION);

Create Spatial Index
CREATE INDEX idx_geom_locationsON locationsUSING GIST (geom);

Create Unique Constraint
Used to prevent duplicate points.
ALTER TABLE locationsADD CONSTRAINT unique_location UNIQUE(lat, lng);

Import OpenStreetMap Data
Install osm2pgsql
sudo apt install osm2pgsql

Download OSM Data
Example:
wget https://download.geofabrik.de/africa/algeria-latest.osm.pbf

Import Into PostGIS
osm2pgsql \  -d gis_db \  --create \  --slim \  -G \  --hstore \  algeria-latest.osm.pbf

Imported OSM Tables
After import:
\dt
You should see:
planet_osm_lineplanet_osm_pointplanet_osm_polygonplanet_osm_roadsplanet_osm_nodesplanet_osm_waysplanet_osm_rels

Project Installation
Clone Repository
git clone <repository_url>
cd topsis_backend

Install Dependencies
npm install

Required Packages
npm install express pg node-fetch cors dotenv

Backend Structure
src/│├── config/│   ├── enricher.js│   ├── db.js│├── services/│   ├── topsisService.js│├── routes/│   ├── topsisRoutes.js│├── controllers/│   ├── topsisController.js│└── server.js

Grid Generation
The system generates geographic points over a selected region.
Example:
function generateGrid() {  const nord = 35.65;  const sud = 35.35;  const ouest = -1.1;  const est = -0.4;  const step = 0.013;  const points = [];  for (let lat = sud; lat <= nord; lat += step) {    for (let lng = ouest; lng <= est; lng += step) {      points.push({ lat, lng });    }  }  return points;}

Data Enrichment
Each geographic point is enriched with:
CriterionDescriptionventWind speedpenteTerrain slopehabitationsNearby building densityexpositionSolar exposurealtitudeElevation

Habitation Calculation
Using OpenStreetMap buildings:
SELECT COUNT(*)FROM planet_osm_polygonWHERE building IS NOT NULLAND ST_DWithin(    way,    ST_Transform(        ST_SetSRID(ST_MakePoint($1, $2), 4326),        3857    ),    100)

Elevation API
Using Open-Meteo:
https://api.open-meteo.com/v1/elevation

Wind API
Using Open-Meteo Forecast API:
https://api.open-meteo.com/v1/forecast

TOPSIS Algorithm
The system uses TOPSIS to rank candidate locations.
Steps


Build decision matrix


Normalize matrix


Apply weights


Compute ideal best/worst


Calculate Euclidean distances


Compute final scores


Rank locations



TOPSIS Criteria
CriterionTypeWindBenefitSlopeCostHabitationsCostExposureBenefitAltitudeBenefit

Example Weights
{  "vent": 0.4,  "pente": 0.2,  "habitations": 0.25,  "exposition": 0.05,  "altitude": 0.1}

API Example
Request
POST /api/topsis
{  "weights": {    "vent": 0.4,    "pente": 0.2,    "habitations": 0.25,    "exposition": 0.05,    "altitude": 0.1  }}

Example Response
{  "success": true,  "count": 34,  "results": [    {      "id": 110,      "lat": 35.72,      "lng": -0.58,      "score": 0.777,      "rank": 1    }  ]}

Frontend Features
Dashboard


Statistics cards


TOPSIS configuration panel


Weight sliders


Ranking table


Interactive GIS map



Map Features
Using Leaflet:


Marker clustering


Heatmaps


Ranked point visualization


Selected area filtering


Popup information


Dynamic color scoring



Launch Backend
npm start
or
npm run dev

Launch Frontend
npm run dev
Default Vite port:
http://localhost:5173

Useful PostgreSQL Commands
Show Tables
\dt

Describe Table
\d locations

Show Extensions
\dx

Delete All Rows
DELETE FROM locations;

Reset Auto Increment
ALTER SEQUENCE locations_id_seq RESTART WITH 1;

Performance Optimizations


GiST spatial indexing


Spatial queries with ST_DWithin


Incremental enrichment


Progress checkpoint system


Duplicate prevention with UNIQUE constraint



Future Improvements


Machine learning integration


Real-time weather data


Terrain raster analysis


Satellite imagery integration


Multi-region analysis


Authentication system


Export to GeoJSON


Advanced GIS layers
