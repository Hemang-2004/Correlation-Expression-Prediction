

var STUDY_START = '2023-07-01';
var STUDY_END = '2025-11-30';
var N_MONTHS = 29;            // Jul 2023 → Nov 2025
var CLOUD_MAX = 30;            // % cloud cover filter (tighter than before)
var BUFFER_M = 150;           // buffer radius around lake centroid (metres)
var DRIVE_FOLDER = 'GEE_BangaloreLakes_WQ';

// ============================================================================
//  LAKE COORDINATES  (80 monitoring stations)
// ============================================================================

var LAKES = [
    { name: 'Devasandra Lake', lon: 77.6553, lat: 13.0220 },
    { name: 'Hebbal Lake', lon: 77.5961, lat: 13.0455 },
    { name: 'Jakkur Lake', lon: 77.6004, lat: 13.0648 },
    { name: 'Nagavara Lake', lon: 77.6130, lat: 13.0318 },
    { name: 'Chelekere Lake', lon: 77.6109, lat: 13.0396 },
    { name: 'Ulsoor Lake', lon: 77.6254, lat: 12.9817 },
    { name: 'Bellandur Lake', lon: 77.6434, lat: 12.9265 },
    { name: 'Varthur Lake', lon: 77.7219, lat: 12.9389 },
    { name: 'Madiwala Lake', lon: 77.6116, lat: 12.9154 },
    { name: 'Kaikondanahalli Lake', lon: 77.6958, lat: 12.9290 },
    { name: 'Puttenahalli Lake', lon: 77.5855, lat: 12.8982 },
    { name: 'Allalasandra Lake', lon: 77.6052, lat: 13.0541 },
    { name: 'Kundalahalli Lake', lon: 77.7004, lat: 12.9766 },
    { name: 'Haralur Lake', lon: 77.6887, lat: 12.9059 },
    { name: 'Agaram Lake', lon: 77.6416, lat: 12.9234 },
    { name: 'Somasundrapalya Lake', lon: 77.6360, lat: 12.9220 },
    { name: 'Sarakki Lake', lon: 77.5720, lat: 12.9201 },
    { name: 'Gottigere Lake', lon: 77.6017, lat: 12.8793 },
    { name: 'Arakere Lake', lon: 77.5989, lat: 12.8944 },
    { name: 'Hulimavu Lake', lon: 77.6060, lat: 12.8917 },
    { name: 'Begur Tank', lon: 77.6220, lat: 12.8740 },
    { name: 'Singasandra Lake', lon: 77.6171, lat: 12.8985 },
    { name: 'Ibbalur Lake', lon: 77.6449, lat: 12.9056 },
    { name: 'Hoskere Lake', lon: 77.6227, lat: 12.9010 },
    { name: 'Hosakerehalli Lake', lon: 77.5406, lat: 12.9421 },
    { name: 'Kodi Singasandra Lake', lon: 77.6260, lat: 12.8999 },
    { name: 'Yelahanka Tank', lon: 77.5966, lat: 13.1012 },
    { name: 'Hesaraghatta Lake', lon: 77.4614, lat: 13.1299 },
    { name: 'Nelamangala Lake', lon: 77.3925, lat: 13.0970 },
    { name: 'Rampura Lake', lon: 77.5900, lat: 13.0150 },
    { name: 'Kalena Agrahara Lake', lon: 77.6271, lat: 12.9128 },
    { name: 'Basavanapura Lake', lon: 77.6808, lat: 12.9985 },
    { name: 'Kothanuru Lake', lon: 77.6744, lat: 13.0121 },
    { name: 'Chinnappanahalli Lake', lon: 77.6895, lat: 12.9967 },
    { name: 'Segehalli Lake', lon: 77.7088, lat: 12.9977 },
    { name: 'Bhattarahalli Lake', lon: 77.7116, lat: 13.0116 },
    { name: 'Vibhuthipura Lake', lon: 77.7157, lat: 12.9887 },
    { name: 'Devarabeesanahalli Lake', lon: 77.7062, lat: 12.9545 },
    { name: 'Kasavanahalli Lake', lon: 77.7311, lat: 12.9408 },
    { name: 'Sheelavanta Lake', lon: 77.7489, lat: 12.9730 },
    { name: 'Parappana Agrahara Lake', lon: 77.6586, lat: 12.9112 },
    { name: 'Chandapura Lake', lon: 77.6534, lat: 12.8419 },
    { name: 'Rayasandra Lake', lon: 77.6618, lat: 12.8560 },
    { name: 'Doddabidarakallu Lake', lon: 77.5133, lat: 13.0742 },
    { name: 'Anchepalya Lake', lon: 77.5024, lat: 13.0596 },
    { name: 'Chikkabanavara Lake', lon: 77.4802, lat: 13.0711 },
    { name: 'Alur Lake', lon: 77.5820, lat: 13.0788 },
    { name: 'Doddakannehalli Lake', lon: 77.6270, lat: 12.9740 },
    { name: 'Yelemallappa Shetty Lake', lon: 77.6780, lat: 13.0066 },
    { name: 'Munekolalu Lake', lon: 77.7004, lat: 12.9601 },
    { name: 'Singapura Lake', lon: 77.5820, lat: 13.0906 },
    { name: 'Veerapura Tank', lon: 77.5600, lat: 13.0870 },
    { name: 'Kannamangala Lake', lon: 77.7671, lat: 13.0661 },
    { name: 'Uttarahalli Doraikere', lon: 77.5475, lat: 12.8980 },
    { name: 'Malathahalli Lake', lon: 77.5358, lat: 12.9480 },
    { name: 'Ullalu Lake', lon: 77.5201, lat: 12.9275 },
    { name: 'Kammagondanahalli Lake', lon: 77.5460, lat: 12.9649 },
    { name: 'Byrasandra Upper Lake', lon: 77.6244, lat: 12.9672 },
    { name: 'Byrasandra Tank', lon: 77.5875, lat: 12.9638 },
    { name: 'Kalkere Tank', lon: 77.7027, lat: 13.0225 },
    { name: 'Nayandanahalli Tank', lon: 77.5227, lat: 12.9342 },
    { name: 'Jigani Tank', lon: 77.5979, lat: 12.8023 },
    { name: 'Dasarahalli Tank', lon: 77.5021, lat: 13.0440 },
    { name: 'Ramammana Kere', lon: 77.5720, lat: 13.0170 },
    { name: 'Yelachenahalli Lake', lon: 77.5855, lat: 12.8982 },
    { name: 'Sompura Lake', lon: 77.6000, lat: 12.9700 },
    { name: 'Tubarahalli Tank', lon: 77.7300, lat: 12.9680 },
    { name: 'Madhure Tank', lon: 77.4800, lat: 13.0500 },
    { name: 'Shivapura Tank', lon: 77.5100, lat: 13.0610 },
    { name: 'Dhorekere Tank', lon: 77.7100, lat: 13.0280 },
    { name: 'Vengaiyyanakere', lon: 77.6871, lat: 13.0088 },
    { name: 'Chinnakurchi Kere', lon: 77.7200, lat: 13.0100 },
    { name: 'Mangamanapalya Lake', lon: 77.6101, lat: 12.9034 },
    { name: 'Anjanapura Lake', lon: 77.5550, lat: 12.8791 },
    { name: 'Soulkere Kaikondrahalli', lon: 77.7010, lat: 12.9275 },
    { name: 'Kudlu Doddakere', lon: 77.6726, lat: 12.9126 },
    { name: 'Karihobanahalli Lake', lon: 77.5200, lat: 13.0050 },
    { name: 'Kannur Lake', lon: 77.6680, lat: 13.0505 },
    { name: 'Yediyur Lake', lon: 77.5755, lat: 12.9348 },
    { name: 'Sankey Tank', lon: 77.5750, lat: 13.0069 }
];

print('Total lakes loaded: ' + LAKES.length);

// ============================================================================
//  SENTINEL-2 COLLECTION — Cloud Masking & Band Scaling
//  Using SCL (Scene Classification Layer) for pixel-level cloud masking
// ============================================================================

/**
 * Mask cloud, cloud shadow, saturated pixels using SCL band.
 * SCL classes kept: 4=Vegetation, 5=Not vegetated, 6=Water, 7=Unclassified
 */
function maskS2Clouds(image) {
    var scl = image.select('SCL');
    // Keep only clear land (4), bare soil (5), water (6), unclassified (7)
    var mask = scl.gte(4).and(scl.lte(7));
    return image
        .updateMask(mask)
        .divide(10000)                       // scale to [0, 1] reflectance
        .copyProperties(image, ['system:time_start', 'CLOUDY_PIXEL_PERCENTAGE']);
}

// ============================================================================
//  SCIENTIFIC SPECTRAL INDEX COMPUTATION
//  All indices computed from surface reflectance bands
//
//  Band reference (Sentinel-2):
//    B2  = Blue      (~490 nm)
//    B3  = Green     (~560 nm)
//    B4  = Red       (~665 nm)
//    B5  = Red-Edge1 (~705 nm)   ← key for NDCI, ChlA
//    B6  = Red-Edge2 (~740 nm)
//    B7  = Red-Edge3 (~783 nm)
//    B8  = NIR       (~842 nm)
//    B8A = Narrow NIR (~865 nm)
//    B11 = SWIR1     (~1610 nm)
//    B12 = SWIR2     (~2190 nm)
// ============================================================================

function computeIndices(image) {

    // ── WATER PRESENCE / EXTENT ──────────────────────────────────────────────

    // NDWI — McFeeters (1996)
    // Positive values indicate open water surface
    var NDWI = image.normalizedDifference(['B3', 'B8']).rename('NDWI');

    // MNDWI — Modified NDWI, Xu (2006)
    // Uses SWIR instead of NIR; better suppresses built-up land noise
    var MNDWI = image.normalizedDifference(['B3', 'B11']).rename('MNDWI');

    // AWEIsh — Automated Water Extraction Index (shadow-insensitive)
    // Feyisa et al. (2014) — excellent for urban lake environments like Bangalore
    var AWEIsh = image.expression(
        'BLUE + 2.5*GREEN - 1.5*(NIR + SWIR1) - 0.25*SWIR2',
        {
            BLUE: image.select('B2'),
            GREEN: image.select('B3'),
            NIR: image.select('B8'),
            SWIR1: image.select('B11'),
            SWIR2: image.select('B12')
        }
    ).rename('AWEIsh');

    // ── TURBIDITY / SUSPENDED SEDIMENT ──────────────────────────────────────

    // NDTI — Normalised Difference Turbidity Index
    // Lacaux et al. (2007); Red–Green ratio in normalised form
    // Higher NDTI → higher turbidity / suspended particulates
    var NDTI = image.normalizedDifference(['B4', 'B3']).rename('NDTI');

    // NDSSI — Normalised Difference Suspended Sediment Index
    // Hossain et al. (2021); Blue–NIR combination
    var NDSSI = image.normalizedDifference(['B2', 'B8']).rename('NDSSI');

    // Turbidity Ratio — Red / Green
    // Simple empirical proxy (Gitelson 1993); correlated with NTU in many studies
    var Turbidity_Ratio = image.select('B4')
        .divide(image.select('B3'))
        .rename('Turbidity_Ratio');

    // ── CHLOROPHYLL-a / ALGAE / EUTROPHICATION ───────────────────────────────

    // NDCI — Normalised Difference Chlorophyll Index
    // Mishra & Mishra (2012) — designed specifically for inland and coastal water
    // Uses Red-Edge (B5) and Red (B4): best Sentinel-2 ChlA index
    // Range: -1 to +1; high positive = high ChlA / bloom
    var NDCI = image.normalizedDifference(['B5', 'B4']).rename('NDCI');

    // ChlA_3Band — Three-band ChlA retrieval proxy
    // Based on Gitelson et al. (2009): (1/B5 - 1/B6) × B7
    // Robust in turbid eutrophic lakes
    var ChlA_3Band = image.expression(
        '((1.0/RE1) - (1.0/RE2)) * NIR2',
        {
            RE1: image.select('B5'),   // Red-Edge 1  ~705 nm
            RE2: image.select('B6'),   // Red-Edge 2  ~740 nm
            NIR2: image.select('B7')    // Red-Edge 3  ~783 nm (used as NIR2)
        }
    ).rename('ChlA_3Band');

    // FAI — Floating Algae Index
    // Hu (2009); detects surface algae / cyanobacteria scum
    // FAI > 0 strongly indicates floating algae / foam (common in Bellandur etc.)
    var FAI = image.expression(
        'NIR - (RED + (SWIR - RED) * ((862 - 665) / (1610 - 665)))',
        {
            NIR: image.select('B8'),    // 842 nm
            RED: image.select('B4'),    // 665 nm
            SWIR: image.select('B11')    // 1610 nm
        }
    ).rename('FAI');

    // NDGI — Normalised Difference Greenness Index (Green – Red)
    // Sensitive to phytoplankton biomass in shallow/turbid waters
    var NDGI = image.normalizedDifference(['B3', 'B4']).rename('NDGI');

    // ── CYANOBACTERIA / HARMFUL ALGAL BLOOM ─────────────────────────────────

    // CI — Cyanobacteria Index (line height at Red-Edge)
    // Wynne et al. (2008) — specifically targets cyanobacteria spectral signature
    // Baseline between 665 nm (B4) and 708 nm (B5); CI = B5 - (B4 + slope)
    var CI = image.expression(
        'B5 - (B4 + (B6 - B4) * ((705 - 665) / (740 - 665)))',
        {
            B4: image.select('B4'),   // Red      665 nm
            B5: image.select('B5'),   // RedEdge1 705 nm
            B6: image.select('B6')    // RedEdge2 740 nm
        }
    ).rename('CI');

    // MCI — Maximum Chlorophyll Index
    // Gower et al. (2005) — fluorescence line height; strong cyanobacteria signal
    // MCI = B5 - B4 - (B6 - B4) × ((705-665)/(740-665))
    var MCI = image.expression(
        'RE1 - RED - (RE2 - RED) * ((705.0 - 665.0) / (740.0 - 665.0))',
        {
            RED: image.select('B4'),
            RE1: image.select('B5'),
            RE2: image.select('B6')
        }
    ).rename('MCI');

    // ── VEGETATION / SHORELINE CONTEXT ──────────────────────────────────────

    // NDVI — Normalised Difference Vegetation Index
    // Useful as a mask (NDVI > 0.3 = land/vegetation, not water)
    // Also helps track riparian vegetation health around lakes
    var NDVI = image.normalizedDifference(['B8', 'B4']).rename('NDVI');

    // ── DISSOLVED ORGANICS / WATER COLOUR ───────────────────────────────────

    // CDOM_Proxy — Green-to-Blue ratio
    // Correlated with dissolved organic carbon / coloured dissolved organic matter
    // High values suggest organic-rich / sewage-impacted water (relevant for BLR lakes)
    var CDOM_Proxy = image.select('B3')
        .divide(image.select('B2'))
        .rename('CDOM_Proxy');

    // S2WI — Sentinel-2 Water Index (combines three bands)
    // Useful for distinguishing water from built-up in urban areas
    var S2WI = image.expression(
        '(GREEN - SWIR1) / (GREEN + SWIR1)',
        {
            GREEN: image.select('B3'),
            SWIR1: image.select('B11')
        }
    ).rename('S2WI');

    return image.addBands([
        NDWI, MNDWI, AWEIsh,
        NDTI, NDSSI, Turbidity_Ratio,
        NDCI, ChlA_3Band, FAI, NDGI,
        CI, MCI,
        NDVI,
        CDOM_Proxy, S2WI
    ]);
}

// ============================================================================
//  BUILD SENTINEL-2 COLLECTION
// ============================================================================

var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterDate(STUDY_START, STUDY_END)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', CLOUD_MAX))
    .map(maskS2Clouds)
    .map(computeIndices);

print('S2 collection size (pre-monthly aggregation): ', s2.size());

// ============================================================================
//  OUTPUT BANDS (only scientific indices — no raw bands)
// ============================================================================

var INDEX_BANDS = [
    // Water presence
    'NDWI', 'MNDWI', 'AWEIsh',
    // Turbidity / sediment
    'NDTI', 'NDSSI', 'Turbidity_Ratio',
    // Chlorophyll-a / algae
    'NDCI', 'ChlA_3Band', 'FAI', 'NDGI',
    // Cyanobacteria / bloom
    'CI', 'MCI',
    // Vegetation context
    'NDVI',
    // Dissolved organics / colour
    'CDOM_Proxy', 'S2WI'
];

// Month offsets: 0 = Jul 2023, 28 = Nov 2025
var monthOffsets = ee.List.sequence(0, N_MONTHS - 1);

// ============================================================================
//  PER-LAKE TIME SERIES BUILDER
//  For each lake: iterate over 29 months, extract mean of each index
// ============================================================================

var allLakeFCs = LAKES.map(function (lake) {

    var lakeGeom = ee.Geometry.Point([lake.lon, lake.lat]).buffer(BUFFER_M);

    var lakeSeries = ee.FeatureCollection(
        monthOffsets.map(function (offset) {

            var off = ee.Number(offset);
            var start = ee.Date('2023-07-01').advance(off, 'month');
            var end = start.advance(1, 'month');
            var label = start.format('MM/yyyy');   // e.g. "07/2023"

            // Monthly median composite (more robust than mean for cloud gaps)
            var monthly = s2.filterDate(start, end);
            var nScenes = monthly.size();
            var composite = monthly.median();

            // Reduce all index bands to mean within lake buffer
            var vals = composite.select(INDEX_BANDS).reduceRegion({
                reducer: ee.Reducer.mean(),
                geometry: lakeGeom,
                scale: 20,          // Sentinel-2 native 20 m for most bands
                maxPixels: 1e8,
                bestEffort: true
            });

            // Also extract standard deviation of NDTI and NDCI as variability proxies
            var vals_sd = composite.select(['NDTI', 'NDCI', 'NDWI']).reduceRegion({
                reducer: ee.Reducer.stdDev(),
                geometry: lakeGeom,
                scale: 20,
                maxPixels: 1e8,
                bestEffort: true
            });

            return ee.Feature(null, vals)
                .set(vals_sd)
                .set('lake_name', lake.name)
                .set('lon', lake.lon)
                .set('lat', lake.lat)
                .set('month_year', label)
                .set('year', start.get('year'))
                .set('month', start.get('month'))
                .set('num_scenes', nScenes);
        })
    );

    return lakeSeries;
});

// ============================================================================
//  MERGE ALL PER-LAKE FCs INTO ONE FLAT FEATURE COLLECTION
// ============================================================================

// JavaScript-side fold/reduce (not GEE server-side) to avoid nesting errors
var combinedFC = allLakeFCs.reduce(function (acc, fc) {
    return acc.merge(fc);
});

// ============================================================================
//  EXPORT — COMBINED CSV (all 80 lakes, all 29 months)
// ============================================================================

// Column order in output CSV
var EXPORT_COLS = [
    'lake_name', 'lon', 'lat', 'month_year', 'year', 'month', 'num_scenes',
    // Water presence / extent
    'NDWI', 'MNDWI', 'AWEIsh',
    // Turbidity / sediment
    'NDTI', 'NDTI_stdDev', 'NDSSI', 'Turbidity_Ratio',
    // Chlorophyll-a / algae / eutrophication
    'NDCI', 'NDCI_stdDev', 'ChlA_3Band', 'FAI', 'NDGI',
    // Cyanobacteria / bloom
    'CI', 'MCI',
    // Vegetation / shoreline
    'NDVI',
    // Dissolved organics / water colour
    'CDOM_Proxy', 'S2WI',
    // Water presence variability
    'NDWI_stdDev'
];

Export.table.toDrive({
    collection: combinedFC,
    description: 'Bangalore_Lakes_ALL_WaterQuality_Indices',
    folder: DRIVE_FOLDER,
    fileNamePrefix: 'bangalore_lakes_all_wq_indices',
    fileFormat: 'CSV',
    selectors: EXPORT_COLS
});

print('✅ Combined CSV task queued: ' + LAKES.length + ' lakes × ' + N_MONTHS + ' months');

// ============================================================================
//  EXPORT — PER-LAKE CSVs (one task per lake, 80 tasks total)
// ============================================================================

allLakeFCs.forEach(function (lakeFC, i) {
    var safeName = LAKES[i].name
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

    Export.table.toDrive({
        collection: lakeFC,
        description: 'BLR_WQ_' + safeName,
        folder: DRIVE_FOLDER,
        fileNamePrefix: 'wq_' + safeName,
        fileFormat: 'CSV',
        selectors: EXPORT_COLS
    });
});

print('✅ ' + LAKES.length + ' per-lake export tasks queued');

// ============================================================================
//  MAP VISUALISATION — CLIPPED TO 80 MONITORING LAKE BUFFERS ONLY
//  Each layer is clipped to the merged geometry of all 80 lake buffers,
//  so index colours appear ONLY at the monitoring stations, not city-wide.
// ============================================================================

Map.setCenter(77.62, 12.97, 11);
Map.setOptions('HYBRID');

// ── Step 1: Build a FeatureCollection of all 80 lake buffer polygons ─────────
//    These are the same 150 m circles used for data extraction above.
var lakeBuffers = ee.FeatureCollection(LAKES.map(function (l) {
    return ee.Feature(
        ee.Geometry.Point([l.lon, l.lat]).buffer(BUFFER_M),
        { name: l.name }
    );
}));

// Merge all 80 buffer polygons into one combined geometry for clipping
var allBuffersGeom = lakeBuffers.geometry();

// ── Step 2: Build latest composite clipped to lake buffers only ───────────────
//    .clip() ensures the raster is masked everywhere EXCEPT the 80 lake circles.
var latestComposite = s2
    .filterDate('2025-09-01', '2025-11-30')
    .median()
    .clip(allBuffersGeom);   // ← THE KEY LINE: restricts render to lake areas only

// ── Step 3: Add index layers — all sourced from the clipped composite ─────────

// NDCI — Chlorophyll-a proxy  (default ON — most useful for water quality)
Map.addLayer(
    latestComposite.select('NDCI'),
    {
        min: -0.2, max: 0.4,
        palette: ['#0d0887', '#6a00a8', '#b12a90', '#e16462', '#fca636', '#f0f921']
    },
    '🟡 NDCI — ChlA Proxy (Sep–Nov 2025)',
    true    // visible by default
);

// MNDWI — Water extent / surface water detection
Map.addLayer(
    latestComposite.select('MNDWI'),
    {
        min: -0.3, max: 0.6,
        palette: ['#8B4513', '#FFFF00', '#00BFFF', '#00008B']
    },
    '💧 MNDWI — Water Extent (Sep–Nov 2025)',
    false
);

// NDTI — Turbidity / suspended sediment
Map.addLayer(
    latestComposite.select('NDTI'),
    {
        min: -0.2, max: 0.4,
        palette: ['#ffffcc', '#a1dab4', '#41b6c4', '#2c7fb8', '#253494']
    },
    '🟤 NDTI — Turbidity (Sep–Nov 2025)',
    false
);

// FAI — Floating algae / foam / cyanobacteria scum
Map.addLayer(
    latestComposite.select('FAI'),
    {
        min: -0.05, max: 0.05,
        palette: ['#ffffff', '#addd8e', '#31a354', '#006837']
    },
    '🌿 FAI — Floating Algae (Sep–Nov 2025)',
    false
);

// AWEIsh — Urban water extraction index
Map.addLayer(
    latestComposite.select('AWEIsh'),
    {
        min: -0.3, max: 0.5,
        palette: ['#d73027', '#fee090', '#e0f3f8', '#4575b4']
    },
    '🔵 AWEIsh — Water Extraction (Sep–Nov 2025)',
    false
);

// CI — Cyanobacteria index
Map.addLayer(
    latestComposite.select('CI'),
    {
        min: -0.01, max: 0.02,
        palette: ['#ffffb2', '#fecc5c', '#fd8d3c', '#e31a1c']
    },
    '🔴 CI — Cyanobacteria (Sep–Nov 2025)',
    false
);

// NDWI — Open water presence
Map.addLayer(
    latestComposite.select('NDWI'),
    {
        min: -0.3, max: 0.5,
        palette: ['#d7191c', '#fdae61', '#ffffbf', '#abd9e9', '#2c7bb6']
    },
    '🌊 NDWI — Open Water (Sep–Nov 2025)',
    false
);

// ── Step 4: Lake buffer outlines — white rings showing the 150 m zones ────────
Map.addLayer(
    lakeBuffers.style({
        color: 'FFFFFF',       // white outline
        fillColor: '00000000',     // fully transparent fill
        width: 1.5
    }),
    {}, '⬜ Lake Buffer Zones (150 m)'
);

// ── Step 5: Lake centroid points on top — always visible ──────────────────────
var lakePoints = ee.FeatureCollection(LAKES.map(function (l) {
    return ee.Feature(ee.Geometry.Point([l.lon, l.lat]), { name: l.name });
}));

Map.addLayer(
    lakePoints.style({ color: '00E5FF', pointSize: 7, pointShape: 'circle' }),
    {}, '🔵 Monitoring Lakes (' + LAKES.length + ')'
);

// ============================================================================
//  CONSOLE SUMMARY
// ============================================================================

print('');
print('══════════════════════════════════════════════════════');
print('  BANGALORE LAKES WATER QUALITY — INDEX EXPORT READY ');
print('══════════════════════════════════════════════════════');
print('  Period:      Jul 2023 → Nov 2025 (' + N_MONTHS + ' months)');
print('  Lakes:       ' + LAKES.length);
print('  Indices:     NDWI, MNDWI, AWEIsh,');
print('               NDTI, NDSSI, Turbidity_Ratio,');
print('               NDCI, ChlA_3Band, FAI, NDGI,');
print('               CI, MCI, NDVI,');
print('               CDOM_Proxy, S2WI');
print('  Resolution:  20 m (Sentinel-2 SR Harmonised)');
print('  Cloud filter: <' + CLOUD_MAX + '% cloud cover');
print('  Buffer:      ' + BUFFER_M + ' m radius per lake centroid');
print('  Output rows: ~' + (LAKES.length * N_MONTHS) + ' (80 lakes × 29 months)');
print('  Drive folder: ' + DRIVE_FOLDER);
print('  Combined CSV: bangalore_lakes_all_wq_indices.csv');
print('  Per-lake:     80 individual CSVs');
print('');
print('  ➤ GO TO TASKS TAB → CLICK RUN NEXT TO EACH TASK');
print('══════════════════════════════════════════════════════');