import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np


for i in range(1,6):
    # 1. Load your dataset
    # (Replace with whichever Pass file you want to analyze)
    df = pd.read_csv(f"Splitted_data/Sentinel_Pass_{i}_Dataset.csv")

    # 2. ARRAY 1: Satellite Parameters (Independent Variables)
    st_params = [
        'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B11', 'B12', 
        'NDWI', 'MNDWI', 'NDCI', 'NDTI', 'Red_Green', 'RedEdge_Ratio',
        'PC1', 'PC2', 'PC3', 'PC4', 'PC5', 'PC6'
    ]

    # 3. ARRAY 2: All Ground Truth Parameters (Raw Data)
    # Including the full suite of lab metrics from your master list
    gt_params = [
        'DO', 'PH', 'CONDUCTIVITY', 'BOD', 'NITRATE_N', 'FECAL_COLI', 
        'TOTAL_COLI', 'CARBONATE', 'BICARBONATE', 'PHENOLPHTHALEINALKALINITY', 
        'TOTALALKALINITY', 'CHLORIDES', 'COD', 'TOTALKJELDAHLNITROGEN', 
        'AMMONICALN', 'TOTALHARDNESS', 'CAASCACO3', 'MGASCACO3', 'SULPHATE', 
        'SODIUM', 'TOTALDISSOLVEDSOLIDS', 'TOTALSUSPENDEDSOLIDS', 'PHOSPHATE', 
        'BORON', 'POTASSIUM', 'FLUORIDE', 'SODIUMPERCENTAGE', 'SAR', 'ORTHOPHOSPHATE'
    ]

    # 6. Filter for columns that actually exist
    valid_st = [c for c in st_params if c in df.columns]
    valid_comparison = [c for c in gt_params if c in df.columns]

        # 7. Compute Correlation
    full_corr = df[valid_st + valid_comparison].corr(method='spearman')
    targeted_corr = full_corr.loc[valid_st, valid_comparison]

    # 8. Plot 
    plt.figure(figsize=(14, 8))

    sns.heatmap(
        targeted_corr, 
        annot=True, 
        fmt=".2f", 
        cmap="RdBu_r", 
        # --- ADJUSTED SCALES ---
        vmin=-0.2,               # Values <= -0.2 will be most blue
        vmax=0.2,                # Values >= 0.2 will be most red
        center=0,                # 0 remains neutral (white)
        # -----------------------
        linewidths=0.5,
        annot_kws={"size": 7, "weight": "bold"},
        cbar_kws={'label': 'Spearman Correlation ($r_s$)'}
    )

    plt.title("Comparison: Raw GT vs. Log-Transformed GT (Satellite Predictors)", fontsize=20, weight='bold', pad=25)
    plt.xlabel("Ground Truth Parameters (Raw and ln_ transformed pairs)", fontsize=14)
    plt.ylabel("Satellite Predictors (ST Bands/Indices)", fontsize=14)

    plt.xticks(rotation=45, ha='right', fontsize=9)
    plt.tight_layout()

    # Save comparison plot
    plt.savefig(f"Splitted_data/spearman/Targeted_Satellite_GT_Correlation_{i}.png", dpi=300)
    # plt.show()
