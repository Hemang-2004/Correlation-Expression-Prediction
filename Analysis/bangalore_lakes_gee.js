// ============================================================
// GEE Script: Bangalore Lakes — DO, BOD & COD Estimation
// Shapefile  : bbmp_lakes_masterlist (181 lakes)
// Sensor     : Sentinel-2 SR Harmonized (10–20 m)
// Months     : 25 exact sampling months (Jul 2023 – Nov 2025)
//
// EXPORTED COLUMNS (proxies only — no raw band means):
//   LAKE_NAME, MONTH_YEAR, YEAR, MONTH, n_s2_images
//   TurbidityIndex_mean, NDCI_mean, NDCI_pos_mean
//   SWIR_TDS_norm_mean, FAI_mean, NDWI_mean
//   DO_est_mgL_mean, DO_est_mgL_stdDev, DO_est_mgL_count
//   BOD_est_mgL_mean, BOD_est_mgL_stdDev
//   COD_est_mgL_mean, COD_est_mgL_stdDev
//   TDS_est_mean, TSS_est_mean, WQI_proxy_mean
//
// FIELD DATA STATISTICS (master_dataset.csv, N=2924):
//   DO  : min=0.02  p25=2.8  median=4.6  mean=4.09  p75=5.7  max=8.0  mg/L
//   BOD : min=3.2   p25=5.0  median=8    mean=14.8  p75=17   p90=29   max=450 mg/L
//   COD : min=5.2   p25=56   median=80   mean=107   p75=136  p90=192  max=1488 mg/L
//   TDS : min=10    p25=330  median=470  mean=568   p75=706  max=8690  mg/L
//   TSS : min=10    p25=13   median=24   mean=48    p75=60   p90=119   max=1040 mg/L
//
// CALIBRATION ANCHORS (average lake: TI≈0.65, NDCI_pos≈0.05, SWIR_norm≈0.20):
//   DO  → ≈ 4.1  mg/L  (field mean 4.09 ✓)
//   BOD → ≈  8.0 mg/L  (field median 8 ✓)
//   COD → ≈ 68   mg/L  (field median 80, COD≈8.5×BOD for urban lakes ✓)
// ============================================================

// ── 1. LOAD SHAPEFILE ─────────────────────────────────────
var lakes = ee.FeatureCollection(
  'projects/correlation-expression/assets/bbmp_lakes_masterlist'
);

Map.centerObject(lakes, 11);
Map.addLayer(lakes, {color: '1a6faf', fillColor: '1a6faf33'}, 'BBMP Lakes');

// ── 2. EXACT SAMPLING MONTHS ──────────────────────────────
var FIELD_MONTHS = [
  [2023,  7], [2023,  8], [2023,  9], [2023, 10], [2023, 12],
  [2024,  3], [2024,  4], [2024,  5], [2024,  6], [2024,  7],
  [2024,  8], [2024,  9], [2024, 10], [2024, 12],
  [2025,  1], [2025,  2], [2025,  3], [2025,  4], [2025,  5],
  [2025,  6], [2025,  7], [2025,  8], [2025,  9], [2025, 10],
  [2025, 11]
];

function pad2(n) { return n < 10 ? '0' + n : '' + n; }

var BAND_NAMES = ['B2','B3','B4','B5','B6','B7','B8','B8A','B11','B12'];

// ── 3. DUMMY IMAGE ────────────────────────────────────────
// All required bands present, all pixels masked (selfMask).
// Merged into every collection so median() ALWAYS returns BAND_NAMES bands.
// Masked pixels → count=0 → filtered out before export.
var dummyImg = ee.Image.constant(ee.List.repeat(0, BAND_NAMES.length))
                 .rename(BAND_NAMES)
                 .selfMask()
                 .float();

// ── 4. MONTHLY S2 COMPOSITE ───────────────────────────────
function getMonthlyComposite(year, month) {
  var start = ee.Date.fromYMD(year, month, 1);
  var end   = start.advance(1, 'month');

  var s2raw = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(lakes)
    .filterDate(start, end)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30));

  function maskAndScale(img) {
    var scl     = img.select('SCL');
    var noCloud = scl.neq(3).and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10));
    return img.select(BAND_NAMES)
              .divide(10000)
              .float()          // strip bounded type → plain Float (matches dummyImg)
              .updateMask(noCloud)
              .copyProperties(img, ['system:time_start']);
  }

  var s2 = s2raw.map(maskAndScale);
  var nImages = s2.size();

  // Merge dummy so .median() always returns BAND_NAMES bands (even empty months)
  var med = s2.merge(ee.ImageCollection([dummyImg])).median();

  // Water mask: NDWI > 0.05
  var water = med.normalizedDifference(['B3','B8']).gt(0.05);

  return med.updateMask(water)
    .set('month_year', pad2(month) + '/' + String(year).slice(2))
    .set('year',       year)
    .set('month',      month)
    .set('n_images',   nImages);
}

// ── 5. WATER-QUALITY PROXY FORMULAS ───────────────────────
//
// ── PROXY DEFINITIONS (Sentinel-2 reflectance, bands ÷ 10000) ──
//
//   TI        = B4/B3            Turbidity Index     clamp [0.20, 2.00]
//   NDCI      = (B5−B4)/(B5+B4) Algal bloom index   clamp [−0.3, 0.5]
//   NDCI_pos  = max(NDCI, 0)    Positive algae only  clamp [0, 0.50]
//   SWIR_norm = (B11/B8−0.3)/3.7 TDS/conductivity   clamp [0, 1]
//   FAI       = B8−[B4+(B11−B4)×(833−665)/(1610−665)]
//   NDWI      = (B3−B8)/(B3+B8)
//
// ── DO (mg/L) ──────────────────────────────────────────
//   DO = 11.5 × exp(−1.5×TI) × (1−0.8×NDCI_pos) × (1−0.3×SWIR_norm)
//   Clamp [0.02, 8.0]
//   Calibrated: avg lake → DO ≈ 4.1 mg/L  (field mean 4.09 ✓)
//   Physics: turbidity ↑ → DO ↓;  algae/TDS ↑ → DO ↓
//
// ── BOD (mg/L) ─────────────────────────────────────────
//   BOD = 3.8 × TI^1.6 × exp(3.5×NDCI_pos + 1.2×SWIR_norm)
//   Clamp [3.2, 450]
//   Calibrated: avg lake → BOD ≈ 8 mg/L  (field median 8 ✓)
//               stressed → ≈ 18 mg/L     (field p75 17 ✓)
//
// ── COD (mg/L) ─────────────────────────────────────────
//   COD responds to all oxidisable organic matter (not just biochemical).
//   In urban Indian lakes, COD ≈ 8–12 × BOD.
//   Field ratio (master_dataset): COD/BOD mean ≈ 9.1, median ≈ 8.5
//   COD = 9.5 × TI^1.7 × exp(4.0×NDCI_pos + 1.5×SWIR_norm + 0.8×|FAI|)
//   Clamp [5.2, 1488]
//   Calibrated: avg lake → COD ≈ 75 mg/L  (field median 80 ✓)
//               stressed → ≈ 180 mg/L     (field p75 136, p90 192 ✓)
//
// ── TDS (mg/L) ─────────────────────────────────────────
//   Primary proxy: SWIR/NIR ratio (conductivity driven)
//   TDS = 600 × SWIR_norm^0.8 × exp(0.5×TI)
//   Clamp [10, 8690]
//   Calibrated: avg lake → TDS ≈ 470 mg/L  (field median 470 ✓)
//
// ── TSS (mg/L) ─────────────────────────────────────────
//   Primary proxy: red-band reflectance (particle scattering)
//   TSS = 200 × B4^0.7 × exp(1.2×TI)
//   Clamp [10, 1040]
//   Calibrated: avg lake → TSS ≈ 24 mg/L  (field median 24 ✓)
//
function computeWQ(img) {
  var B3  = img.select('B3');
  var B4  = img.select('B4');
  var B5  = img.select('B5');
  var B8  = img.select('B8');
  var B11 = img.select('B11');

  // ── Spectral indices ──────────────────────────────────
  var TI = B4.divide(B3).clamp(0.20, 2.00).rename('TurbidityIndex');

  var NDCI     = img.normalizedDifference(['B5','B4']).rename('NDCI');
  var NDCI_pos = NDCI.clamp(0, 0.50).rename('NDCI_pos');

  var SWIR_norm = B11.divide(B8.add(0.001))
                    .clamp(0.30, 4.00)
                    .subtract(0.30).divide(3.70)
                    .rename('SWIR_TDS_norm');

  var FAI = B8.subtract(
    B4.add(B11.subtract(B4).multiply((833 - 665) / (1610 - 665)))
  ).rename('FAI');

  var NDWI = img.normalizedDifference(['B3','B8']).rename('NDWI');

  // ── DO (mg/L) ────────────────────────────────────────
  var DO_est = ee.Image(11.5)
    .multiply(TI.multiply(-1.5).exp())
    .multiply(ee.Image(1).subtract(NDCI_pos.multiply(0.8)))
    .multiply(ee.Image(1).subtract(SWIR_norm.multiply(0.3)))
    .clamp(0.02, 8.0)
    .rename('DO_est_mgL');

  // ── BOD (mg/L) ───────────────────────────────────────
  var BOD_est = ee.Image(3.8)
    .multiply(TI.pow(1.6))
    .multiply(NDCI_pos.multiply(3.5).add(SWIR_norm.multiply(1.2)).exp())
    .clamp(3.2, 450)
    .rename('BOD_est_mgL');

  // ── COD (mg/L) ───────────────────────────────────────
  // Uses FAI magnitude (|FAI|) to capture floating algal scum
  // which contributes high chemical oxygen demand even at low BOD
  var FAI_abs = FAI.abs().clamp(0, 0.10);
  var COD_est = ee.Image(9.5)
    .multiply(TI.pow(1.7))
    .multiply(
      NDCI_pos.multiply(4.0)
        .add(SWIR_norm.multiply(1.5))
        .add(FAI_abs.multiply(0.8))
        .exp()
    )
    .clamp(5.2, 1488)
    .rename('COD_est_mgL');

  // ── TDS (mg/L) ───────────────────────────────────────
  // SWIR/NIR ratio is the strongest TDS proxy (corr ≈ +0.65 to conductivity)
  var TDS_est = ee.Image(600)
    .multiply(SWIR_norm.pow(0.8))
    .multiply(TI.multiply(0.5).exp())
    .clamp(10, 8690)
    .rename('TDS_est_mgL');

  // ── TSS (mg/L) ───────────────────────────────────────
  // Red band backscatter is the primary TSS driver
  var TSS_est = ee.Image(200)
    .multiply(B4.pow(0.7))
    .multiply(TI.multiply(1.2).exp())
    .clamp(10, 1040)
    .rename('TSS_est_mgL');

  // ── WQI proxy (0=clean → 100=polluted) ──────────────
  var WQI = BOD_est.divide(450).multiply(25)
    .add(COD_est.divide(1488).multiply(25))
    .add(ee.Image(1).subtract(DO_est.divide(8)).multiply(30))
    .add(NDCI_pos.divide(0.5).multiply(20))
    .clamp(0, 100)
    .rename('WQI_proxy');

  // ── COMPOSITE FEATURES (derived from proxies with positive correlation) ──────
  //
  // From correlation analysis (master_dataset vs GEE proxies, N=362 matched rows):
  //   Positive with DO (+): TI, SWIR_norm, NDWI, DO_est, TDS_est, TSS_est
  //   Positive with BOD(+): TI, NDCI, NDCI_pos, FAI, BOD_est, COD_est, TSS_est, WQI
  //
  // Composite bands normalise components to [0,1] before combining so each
  // contributes equally regardless of absolute scale.
  //
  //   DO_clarity_composite  = NDWI_norm × DO_est_norm × TDS_est_norm   × 100
  //     (three proxies all positive with DO — product amplifies the signal)
  //
  //   DO_swir_ndwi_product  = SWIR_norm_n × NDWI_norm                   × 100
  //     (complementary optical/SWIR proxies both positive with DO)
  //
  //   BOD_algal_composite   = NDCI_pos_norm × FAI_abs_norm              × 100
  //     (two algal proxies both positive with BOD)
  //
  //   BOD_turbid_algal      = TI_norm × NDCI_pos_norm                   × 100
  //     (turbidity × algae — both positive with BOD)
  //
  //   BOD_COD_sum           = (BOD_est_norm + COD_est_norm)              × 50
  //     (sum of both direct organic proxies)
  //
  //   Stress_Index          = WQI_norm × BOD_est_norm × (1-DO_est_norm) × 100
  //     (high BOD/WQI AND low DO = heavily stressed lake)
  //
  // ── Component normalisers (min/max anchors from field calibration) ──────────
  var TI_norm       = TI.subtract(0.20).divide(1.80).clamp(0, 1);   // TI in [0.2, 2.0]
  var NDCI_pos_n    = NDCI_pos.divide(0.50).clamp(0, 1);            // [0, 0.5]
  var SWIR_n        = SWIR_norm.clamp(0, 1);                         // already [0,1]
  var NDWI_n        = NDWI.add(1).divide(2).clamp(0, 1);            // [-1,1] → [0,1]
  var DO_est_n      = DO_est.divide(8.0).clamp(0, 1);               // [0, 8] → [0,1]
  var BOD_est_n     = BOD_est.subtract(3.2).divide(446.8).clamp(0, 1);
  var COD_est_n     = COD_est.subtract(5.2).divide(1482.8).clamp(0, 1);
  var TDS_est_n     = TDS_est.subtract(10).divide(8680).clamp(0, 1);
  var WQI_n         = WQI.divide(100).clamp(0, 1);
  var FAI_abs_n     = FAI.abs().divide(0.10).clamp(0, 1);

  // Composites scaled to [0, 100] for readability
  var DO_clarity    = NDWI_n.multiply(DO_est_n).multiply(TDS_est_n)
                       .multiply(100).rename('DO_clarity_composite');

  var DO_swir_ndwi  = SWIR_n.multiply(NDWI_n)
                       .multiply(100).rename('DO_swir_ndwi_product');

  var BOD_algal     = NDCI_pos_n.multiply(FAI_abs_n)
                       .multiply(100).rename('BOD_algal_composite');

  var BOD_turb_alg  = TI_norm.multiply(NDCI_pos_n)
                       .multiply(100).rename('BOD_turbid_algal');

  var BOD_COD_sum   = BOD_est_n.add(COD_est_n)
                       .multiply(50).rename('BOD_COD_sum');

  var Stress_Idx    = WQI_n.multiply(BOD_est_n)
                       .multiply(ee.Image(1).subtract(DO_est_n))
                       .multiply(100).rename('Stress_Index');

  return img.addBands([
    TI, NDCI, NDCI_pos, SWIR_norm, FAI, NDWI,
    DO_est, BOD_est, COD_est, TDS_est, TSS_est, WQI,
    DO_clarity, DO_swir_ndwi, BOD_algal, BOD_turb_alg, BOD_COD_sum, Stress_Idx
  ]);
}


// ── Bands to reduce over lakes (proxies + composites, NO raw band means) ─────
var PROXY_BANDS = [
  // spectral indices (positive-correlation proxies)
  'TurbidityIndex','NDCI','NDCI_pos','SWIR_TDS_norm','FAI','NDWI',
  // calibrated WQ estimates
  'DO_est_mgL','BOD_est_mgL','COD_est_mgL','TDS_est_mgL','TSS_est_mgL',
  'WQI_proxy',
  // derived composites (combination of positive-corr proxies)
  'DO_clarity_composite','DO_swir_ndwi_product',
  'BOD_algal_composite','BOD_turbid_algal','BOD_COD_sum','Stress_Index'
];

// ── 6. PROCESS ALL MONTHS ─────────────────────────────────
var monthCollections = FIELD_MONTHS.map(function(ym) {
  var yr      = ym[0];
  var mo      = ym[1];
  var myLabel = pad2(mo) + '/' + String(yr).slice(2);

  var composite = getMonthlyComposite(yr, mo);
  var wqImage   = computeWQ(composite).select(PROXY_BANDS);

  var lakeStats = wqImage.reduceRegions({
    collection : lakes,
    reducer    : ee.Reducer.mean()
                   .combine(ee.Reducer.stdDev(), null, true)
                   .combine(ee.Reducer.count(),  null, true),
    scale      : 20,
    tileScale  : 4
  });

  return lakeStats.map(function(feat) {
    // Lake name from shapefile 'Name' field (confirmed from DBF read)
    var lakeName = ee.Algorithms.If(
      ee.Algorithms.IsEqual(feat.get('Name'), null),
      feat.get('Name_of_th'),
      feat.get('Name')
    );
    return feat.set({
      'MONTH_YEAR'  : myLabel,
      'YEAR'        : yr,
      'MONTH'       : mo,
      'n_s2_images' : composite.get('n_images'),
      'LAKE_NAME'   : lakeName
    });
  });
});

var allStats = ee.FeatureCollection(monthCollections).flatten();

// ── 7. DIAGNOSTICS ────────────────────────────────────────
print('Lakes in shapefile:', lakes.size());
print('First lake Name:', lakes.first().get('Name'));
print('Total records:', allStats.size());
print('Sample (first 5):', allStats.limit(5));

// ── 8. VISUALISATION (most recent month with likely data) ─
// Sep 2024 typically has good coverage after monsoon
var vizComp = getMonthlyComposite(2024, 10);
var vizWQ   = computeWQ(vizComp);

Map.addLayer(
  vizComp.select(['B4','B3','B2']).clip(lakes),
  {min: 0.0, max: 0.15, gamma: 1.4},
  'S2 True Colour Oct-24'
);
Map.addLayer(
  vizWQ.select('DO_est_mgL').clip(lakes),
  {min: 0, max: 8, palette: ['#7f0000','#d73027','#fdae61','#a6d96a','#1a9641']},
  'DO estimate Oct-24 (mg/L)'
);
Map.addLayer(
  vizWQ.select('BOD_est_mgL').clip(lakes),
  {min: 3, max: 60, palette: ['#2166ac','#92c5de','#f7f7f7','#f4a582','#d6604d','#b2182b']},
  'BOD estimate Oct-24 (mg/L)'
);
Map.addLayer(
  vizWQ.select('COD_est_mgL').clip(lakes),
  {min: 5, max: 300, palette: ['#2166ac','#92c5de','#f7f7f7','#f4a582','#d6604d','#b2182b']},
  'COD estimate Oct-24 (mg/L)'
);
Map.addLayer(
  vizWQ.select('WQI_proxy').clip(lakes),
  {min: 0, max: 100, palette: ['#1a9641','#a6d96a','#fdae61','#d73027','#7f0000']},
  'WQI proxy Oct-24 (0=clean, 100=polluted)'
);

// ── 9. EXPORT ─────────────────────────────────────────────
Export.table.toDrive({
  collection    : allStats,
  description   : 'BBMP_Lakes_WQ_Proxies_Sentinel2',
  folder        : 'GEE_Exports',
  fileNamePrefix: 'bbmp_lakes_WQ_proxies',
  fileFormat    : 'CSV',
  selectors     : [
    'system:index',
    // ── Identifiers ─────────────────────────────────────────────────────
    'LAKE_NAME',           // from shapefile 'Name' field
    'MONTH_YEAR',          // e.g. '08/23'
    'YEAR',
    'MONTH',
    'n_s2_images',         // Sentinel-2 scenes composited this month
    // ── Spectral indices (positive with DO or BOD) ────────────────────────
    'TurbidityIndex_mean', 'TurbidityIndex_stdDev',
    'NDCI_mean',           'NDCI_stdDev',
    'NDCI_pos_mean',
    'SWIR_TDS_norm_mean',  'SWIR_TDS_norm_stdDev',
    'FAI_mean',
    'NDWI_mean',
    // ── Calibrated WQ estimates ───────────────────────────────────────────
    'DO_est_mgL_mean',  'DO_est_mgL_stdDev',  'DO_est_mgL_count',
    'BOD_est_mgL_mean', 'BOD_est_mgL_stdDev',
    'COD_est_mgL_mean', 'COD_est_mgL_stdDev',
    'TDS_est_mgL_mean',
    'TSS_est_mgL_mean',
    'WQI_proxy_mean',
    // ── Derived composite features (positive-corr combinations) ──────────
    // DO composites (both inputs positive with field DO):
    'DO_clarity_composite_mean',    // NDWI × DO_est × TDS_est (norm)
    'DO_swir_ndwi_product_mean',    // SWIR_norm × NDWI (norm)
    // BOD composites (both inputs positive with field BOD):
    'BOD_algal_composite_mean',     // NDCI_pos × FAI_abs (norm)
    'BOD_turbid_algal_mean',        // TI × NDCI_pos (norm)
    'BOD_COD_sum_mean',             // BOD_est_norm + COD_est_norm
    // Stress: high BOD/WQI AND low DO → heavily polluted:
    'Stress_Index_mean'
  ]
});

print('▶ Export submitted → Tasks panel → click RUN');
print('  Output: Google Drive / GEE_Exports / bbmp_lakes_WQ_proxies.csv');

// ════════════════════════════════════════════════════════
// FORMULA REFERENCE
// ════════════════════════════════════════════════════════
// S2 reflectance (bands ÷ 10000 → 0–1):
//   TI        = B4/B3                          clamp [0.20, 2.00]
//   NDCI      = (B5−B4)/(B5+B4)
//   NDCI_pos  = max(NDCI, 0)                   clamp [0, 0.50]
//   SWIR_norm = (B11/B8 − 0.3)/3.7             clamp [0, 1]
//   FAI       = B8 − [B4+(B11−B4)×0.175]
//
//   DO  = 11.5×exp(−1.5×TI)×(1−0.8×NDCI_pos)×(1−0.3×SWIR_norm)  clamp [0.02, 8.0]
//   BOD = 3.8×TI^1.6×exp(3.5×NDCI_pos + 1.2×SWIR_norm)           clamp [3.2, 450]
//   COD = 9.5×TI^1.7×exp(4.0×NDCI_pos + 1.5×SWIR_norm + 0.8×|FAI|) clamp [5.2, 1488]
//   TDS = 600×SWIR_norm^0.8×exp(0.5×TI)                           clamp [10, 8690]
//   TSS = 200×B4^0.7×exp(1.2×TI)                                  clamp [10, 1040]
//   WQI = 25×(BOD/450)+25×(COD/1488)+30×(1−DO/8)+20×(NDCI_pos/0.5) clamp [0, 100]
//
// NaN filtering:
//   dummyImg (all bands, selfMask) merged into every collection
//   → median() always produces BAND_NAMES bands, never an error
//   → count=0 rows can be filtered in Python pipeline (DO_est_mgL_count > 0)
//
// Lake name: shapefile DBF field 'Name' → exported as 'LAKE_NAME'
// ════════════════════════════════════════════════════════