# Bangalore Lakes Water Quality: ML & Spatial Analysis Pipeline

This repository contains a robust Machine Learning and Spatial Analysis pipeline aimed at understanding, predicting, and monitoring the water quality of lakes in Bangalore, India. It brings together physical ground-truth water quality data and Sentinel-2 satellite imagery to create an end-to-end analytical framework.

## 1. Why we chose these factors in the ML Pipeline
In the ML pipeline (`ml_pipeline.ipynb`), we targeted predicting five core factors: **DO (Dissolved Oxygen), BOD (Biochemical Oxygen Demand), PH, COD (Chemical Oxygen Demand), and NITRATE_N**. 
* **DO & BOD:** The fundamental indicators of a aquatic ecosystem's health. High BOD and low DO indicate severe organic pollution and lack of oxygen for aquatic life.
* **COD:** Measures all chemical oxidation, capturing both biodegradable and non-biodegradable industrial/chemical pollutants.
* **NITRATE_N:** A direct indicator of agricultural runoff and sewage (eutrophication drivers).
* **PH:** Determines the acidity/alkalinity, affecting chemical solubility and biological availability of nutrients.

We used spatial features (`Lattitude`, `Longitude`), temporal features (`MONTH_YEAR` encoded), and intrinsic physical characteristics (`MIN_TEMP`, `MAX_TEMP`, `WIND_SPEED`, `PRECIPITATION`) as predictors. Weather influences evaporation, dilution, and microbial activity, while spatial features encode geographic clustering of pollution sources (e.g., industrial zones vs. residential).

## 2. Why these factors in the GEE Script
The Google Earth Engine script (`bangalore_lakes_gee.js`) extracts Sentinel-2 satellite data. Since we cannot directly "see" chemical BOD or DO from space, we extract optical proxies that strongly correlate with biochemical realities:
* **NDWI & MNDWI (Water Indices):** Used to map the actual surface water extent, separating water from urban infrastructure and vegetation.
* **Turbidity Proxy (Red/Green Ratio):** Murky water scatters more red light. High turbidity correlates positively with high COD and suspended solids (TSS).
* **Chlorophyll-a Proxy (Red-Edge/Red Ratio):** Measures algal blooms. High Chl-a is a direct result of high Nitrates/Phosphates (eutrophication) and leads to crashing DO levels at night.
* **FAI (Floating Algae Index):** Specifically sensitive to severe surface algal scum, a common issue in heavily polluted Bangalore lakes (like Bellandur).
* **NDVI/NDSI:** Track vegetation encroachment (weeds/hyacinth) and sedimentation.

## 3. What we can predict using all of this
By merging the ML pipeline and GEE outputs, we establish a **Proxy-to-Parameter bridge**. 
* **Spatial-Temporal Forecasting:** The current ML models can predict *future* BOD, COD, and DO values for a specific lake based on upcoming weather forecasts and historical trends.
* **Satellite-to-Ground Inference:** By training an ML model using the ground-truth table alongside the GEE proxy data (Chl-a, Turbidity), we can predict accurate DO, BOD, and Nitrate levels for lakes that *don't* have physical monitoring stations, simply by looking at their satellite image.
* **Anomaly Detection:** Quickly identifying illegal industrial dumping or sudden algal blooms by spotting unexpected spikes in Turbidity or FAI from the satellite data before physical water testing is completed.

## 4. Understanding the current Accuracy (~0.83 R²)
The current models achieve high R² scores (up around 0.80 - 0.85) for predicting these chemical parameters.
* **Why it's good:** Predicting chaotic biochemical systems with ~83% variance explanation using only weather, time, and location is exceptionally strong. It proves that pollution in Bangalore lakes follows highly structured spatial and seasonal patterns (e.g., monsoon dilution vs. summer concentration).
* **Why it caps out here:** The remaining ~17% variance is due to "unseen" localized events—illegal sudden dumping of industrial effluent, temporary STP (Sewage Treatment Plant) failures, or highly localized heavy rainfall. These micro-events cannot be predicted strictly by geographic coordinates, monthly averages, or macro-weather data.

## 5. How we can improve the Pipeline
To push the accuracy into the 0.90+ range and make the system truly real-time:

1. **Integrate the Datasets (The Ultimate Goal):** The immediate next step is to physically merge the GEE exported CSVs (containing optical proxies like Turbidity/Chl-a) into the ML `master_dataset.csv`. Feeding the satellites' optical view of the lake on a specific month into the ML model as features (e.g., predicting `BOD` using `MAX_TEMP` + `GEE_Turbidity` + `GEE_FAI`) will massively bridge the gap between "unseen" pollution events and the model.
2. **Lag Features & Time-Series:** The current neural networks treat rows mostly independently. Implementing robust recursive LSTM models that look at the a rolling window of the past 3 months to predict the next month.
3. **Advanced Ensemble & Deep Learning Architecture:** We've introduced a baseline Stacking Ensemble. We can expand this by using a hybrid architecture: processing the raw tabular data with LightGBM/XGBoost, passing it through a dense layer, and concatenating it with an LSTM processing the local weather/satellite time-series.
4. **Finer Temporal Resolution:** Aggregating data purely by month smooths out extreme spikes. If weekly testing data and bi-weekly Sentinel-2 (clear sky) data can be matched, short-term extreme pollution events can be modeled.
