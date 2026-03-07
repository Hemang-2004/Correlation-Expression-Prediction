/**
 * ============================================================================
 *  BANGALORE LAKES — Water Quality Data Export Script (FIXED)
 *  Google Earth Engine (GEE) JavaScript
 *
 *  HOW TO USE:
 *    1. Paste this entire script into https://code.earthengine.google.com/
 *    2. Click RUN
 *    3. In the Tasks tab (top-right), click RUN next to each export task
 *    4. Files appear in your Google Drive → folder "GEE_BangaloreLakes"
 *
 *  EXPORTS (one combined CSV + one per lake):
 *    NDWI, MNDWI, NDVI, NDSI, Turbidity, ChlA, FAI, B2/B3/B4/B8/B11
 * ============================================================================
 */

// ============================================================================
//  CONFIGURATION
// ============================================================================

var STUDY_START = '2023-07-01';
var STUDY_END = '2025-11-30';
var CLOUD_MAX = 40;
var BUFFER_M = 150;
var DRIVE_FOLDER = 'GEE_BangaloreLakes';

// ============================================================================
//  LAKE COORDINATES  (80 lakes from the monitoring dataset)
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

print('Total lakes: ' + LAKES.length);

// ============================================================================
//  SENTINEL-2 COLLECTION
// ============================================================================

function maskClouds(image) {
    var scl = image.select('SCL');
    var mask = scl.gte(4).and(scl.lte(7));
    return image.updateMask(mask)
        .divide(10000)
        .copyProperties(image, ['system:time_start']);
}

function addIndices(image) {
    var ndwi = image.normalizedDifference(['B3', 'B8']).rename('NDWI');
    var mndwi = image.normalizedDifference(['B3', 'B11']).rename('MNDWI');
    var ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
    var ndsi = image.normalizedDifference(['B3', 'B8A']).rename('NDSI');
    var turbidity = image.select('B4').divide(image.select('B3')).rename('Turbidity');
    var chla = image.select('B5').divide(image.select('B4')).rename('ChlA');
    var fai = image.expression(
        'NIR - (RED + (SWIR - RED) * 0.2105)',
        { NIR: image.select('B8'), RED: image.select('B4'), SWIR: image.select('B11') }
    ).rename('FAI');
    return image.addBands([ndwi, mndwi, ndvi, ndsi, turbidity, chla, fai]);
}

var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterDate(STUDY_START, STUDY_END)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', CLOUD_MAX))
    .map(maskClouds)
    .map(addIndices);

// ============================================================================
//  MONTH LIST  (29 months: Jul 2023 → Nov 2025)
// ============================================================================

var N_MONTHS = 29;
var monthOffsets = ee.List.sequence(0, N_MONTHS - 1);

// Output bands to extract
var BANDS = ['B2', 'B3', 'B4', 'B8', 'B11',
    'NDWI', 'MNDWI', 'NDVI', 'NDSI', 'Turbidity', 'ChlA', 'FAI'];

// ============================================================================
//  EXPORT 1: ALL LAKES COMBINED — single CSV
//  Pattern: for each lake, build a time series; merge all into one FC
// ============================================================================

// Build one FeatureCollection per lake, then merge all of them together.
// This avoids the "collection-in-algorithm" error by keeping everything
// as flat Feature objects from the start.

var allLakeFCs = LAKES.map(function (l) {
    var lakeGeom = ee.Geometry.Point([l.lon, l.lat]).buffer(BUFFER_M);

    var lakeSeries = ee.FeatureCollection(monthOffsets.map(function (offset) {
        var off = ee.Number(offset);
        var start = ee.Date('2023-07-01').advance(off, 'month');
        var end = start.advance(1, 'month');
        var label = start.format('MM/yyyy');

        var scenes = s2.filterDate(start, end);
        var nScenes = scenes.size();
        var composite = scenes.median();

        var vals = composite.select(BANDS).reduceRegion({
            reducer: ee.Reducer.mean(),
            geometry: lakeGeom,
            scale: 20,
            maxPixels: 1e7,
            bestEffort: true
        });

        return ee.Feature(null, vals)
            .set('lake_name', l.name)
            .set('lon', l.lon)
            .set('lat', l.lat)
            .set('month_year', label)
            .set('year', start.get('year'))
            .set('month', start.get('month'))
            .set('num_scenes', nScenes);
    }));

    return lakeSeries;
});

// Merge all per-lake FCs into one flat FeatureCollection
// Start with the first FC then iterate merge — avoids nesting issues
var combinedFC = allLakeFCs.reduce(function (acc, fc) {
    return acc.merge(fc);
});

// ============================================================================
//  EXPORT — COMBINED CSV
// ============================================================================

Export.table.toDrive({
    collection: combinedFC,
    description: 'Bangalore_Lakes_ALL_WaterQuality',
    folder: DRIVE_FOLDER,
    fileNamePrefix: 'bangalore_lakes_all_water_quality',
    fileFormat: 'CSV',
    selectors: [
        'lake_name', 'lon', 'lat', 'month_year', 'year', 'month', 'num_scenes',
        'NDWI', 'MNDWI', 'NDVI', 'NDSI', 'Turbidity', 'ChlA', 'FAI',
        'B2', 'B3', 'B4', 'B8', 'B11'
    ]
});

print('✅ Task queued: Combined CSV (' + LAKES.length + ' lakes × ' + N_MONTHS + ' months)');

// ============================================================================
//  EXPORT — PER-LAKE CSVs  (one task per lake)
// ============================================================================

allLakeFCs.forEach(function (lakeFC, i) {
    var safeName = LAKES[i].name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
    Export.table.toDrive({
        collection: lakeFC,
        description: 'BLR_' + safeName,
        folder: DRIVE_FOLDER,
        fileNamePrefix: 'lake_' + safeName,
        fileFormat: 'CSV',
        selectors: [
            'lake_name', 'lon', 'lat', 'month_year', 'year', 'month', 'num_scenes',
            'NDWI', 'MNDWI', 'NDVI', 'NDSI', 'Turbidity', 'ChlA', 'FAI',
            'B2', 'B3', 'B4', 'B8', 'B11'
        ]
    });
});

print('✅ ' + LAKES.length + ' per-lake export tasks queued');
print('');
print('══════════════════════════════════════════');
print('  GO TO THE TASKS TAB → CLICK RUN ON EACH');
print('  Output folder: Google Drive → ' + DRIVE_FOLDER);
print('  Combined file: bangalore_lakes_all_water_quality.csv');
print('  + ' + LAKES.length + ' individual lake CSVs');
print('══════════════════════════════════════════');

// ============================================================================
//  SIMPLE MAP DISPLAY  (just lake points, no complex layer logic)
// ============================================================================

Map.setCenter(77.62, 12.97, 11);
Map.setOptions('HYBRID');

var lakePoints = ee.FeatureCollection(LAKES.map(function (l) {
    return ee.Feature(ee.Geometry.Point([l.lon, l.lat]), { name: l.name });
}));

Map.addLayer(
    lakePoints.style({ color: '00DDFF', pointSize: 6, pointShape: 'circle' }),
    {}, 'Monitoring Lakes (' + LAKES.length + ')'
);

// Show median RGB of latest available month for context
var latestComposite = s2.filterDate('2025-10-01', '2025-11-30').median();
Map.addLayer(
    latestComposite,
    { bands: ['B4', 'B3', 'B2'], min: 0, max: 0.25 },
    'Sentinel-2 RGB (Oct-Nov 2025)',
    false
);
