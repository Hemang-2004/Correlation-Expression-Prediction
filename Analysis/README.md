# 🌊 Bangalore Lakes Water Quality — ML Pipeline Analysis

This directory contains the complete Machine Learning and Deep Learning pipeline for analyzing, modeling, and predicting water quality metrics across various lakes in Bangalore based on the core environmental criteria.

## 📊 Dataset & Targets

- **Data Source**: `master_dataset.csv` (monitoring data collected from July 2023 to November 2025).
- **Split Strategy**: A robust **80-20 Train/Test Split** to maintain an isolated test set for model evaluation.
- **Target Variables Evaluated (Numerical Mathematical Factors Only)**:  
  `DO`, `BOD`, `CARBONATE`, `BICARBONATE`, `TOTALALKALINITY` *(chosen as the best integrated alkalinity factor)*, `TOTALHARDNESS`, `TOTALDISSOLVEDSOLIDS`, `TOTALSUSPENDEDSOLIDS`.  
  *(Note: Non-numerical identifiers like `STN CODE`, `MONTH/YEAR`, `NAME`, and `USEBASED CLASS` have been strictly excluded from the prediction target list).*

## ⚙️ Data Preprocessing & Feature Engineering

1. **Cleaning & Outlier Removal**: Missing values across all 32 numerical columns were handled via `SimpleImputer`. An IQR (Interquartile Range) capping strategy was then applied to prevent extreme outliers from heavily biasing the model coefficients.
2. **Temporal Transformations**: To accurately interpret continuous sequential variations, we generated temporal attributes including `MONTH`, `YEAR_NUM`, cyclical embeddings (`MONTH_SIN`, `MONTH_COS`), and a continuous `TIME_INDEX`.
3. **Scaling Strategy**: `StandardScaler` was fit strictly on the training set to prevent accidental data leakage, providing identically scaled numerical signals to models downstream.

## 🤖 Classical Machine Learning & Pipeline Optimization

In total, **12 Classical ML Models** (ranging from simple Linear Regression and Ridge to robust tree-based regressors like RandomForest and ExtraTrees) were separately trained for all 8 water quality attributes.

- **Hyperparameter Tuning Strategy**: After reviewing the default 80-20 split performance of each algorithm, `GridSearchCV` was strictly deployed on the top-performing classical models to fine-tune their learning configurations.

### 🧠 Deep Learning Execution (CNN, LSTM, FNN)
We further evaluated the impact of non-linear functional mapping through Neural Networks by constructing three tailored architectures using Keras/TensorFlow:
- **Feed-Forward Neural Network (FNN)**: Achieved >0.96 R² on specific markers (like Total Hardness) with roughly ~52k parameters.
- **1D Convolutional Neural Network (1D-CNN)**: ~51k parameters designed to pick up on continuous local fluctuations across all variables.
- **Long Short-Term Memory (LSTM)**: ~122k parameter network optimized to contextualize temporal signals prior to projection.

*Evaluation Note: While the DL suite generated strong validation trajectories and tracked correlations properly, **the Tree-based Ensembles (ExtraTrees, RandomForest, and GradientBoosting) frequently surpassed Neural methodologies on tabular benchmarks** specific to this dataset matrix.*

## 🏆 Final Model Accuracies & Evaluation

Below are the final compiled evaluation metrics (R² & RMSE on the testing sets) for the undisputed champion model corresponding to each individual attribute.

| Target Factor | Champion Model | R² Score | RMSE |
|--------------|----------------|----------|------|
| **DO** | RandomForest (Tuned) | **0.8673** | 0.72 |
| **BOD** | GradientBoosting | **0.9291** | 3.75 |
| **CARBONATE** | ExtraTrees | **0.9819** | 2.89 |
| **BICARBONATE** | RandomForest | **0.8342** | 51.39 |
| **TOTALALKALINITY** | ExtraTrees | **0.8427** | 51.65 |
| **TOTALHARDNESS** | GradientBoosting (Tuned) | **0.9940** | 10.09 |
| **TOTALDISSOLVEDSOLIDS** | ExtraTrees | **0.9949** | 25.48 |
| **TOTALSUSPENDEDSOLIDS** | LightGBM | **0.4876** | 39.30 |

## 🔮 Future Forecasting Trends (April – August 2026)

Using the highest-performing configurations established during testing, we extrapolated the target vectors 5 months further into the future (Months: April, May, June, July, and August 2026). Our pipeline programmatically generated the target feature blocks mapping to these time horizons, generating dynamic predictive traces:

- ➡️ **Stable/Flattened Indicators**: `DO` (~4.80 mg/L), `BOD` (~7.51 mg/L), `BICARBONATE` (~161-162 mg/L), `TOTALALKALINITY` (~167 mg/L), `TOTALHARDNESS` (~164 mg/L), and `TOTALDISSOLVEDSOLIDS` (~503 mg/L).
- 📈 **Escalating Indicators**: The regression suite detects an increasing trajectory for `CARBONATE` (predictive rise from 16 to 22.75 mg/L by August) and `TOTALSUSPENDEDSOLIDS` (simulated jump from 9.69 to ~22.70 mg/L).

*These extrapolations are permanently stored inside the newly generated `forecast_apr_aug_2026.csv` artifact.*

## 🖼️ Programmatic Artifact Control (Images)

In accordance with architectural standards, **all graphical visualizations**, ranging from multi-axis model metric heatmaps, bar chart forecasts, actual vs. predicted distributions, spatial distribution charts, and CNN/LSTM/FNN epochs histories **have been systematically compiled to the inner `/images` directory**. No loose `.png` images populate the root folder context.
