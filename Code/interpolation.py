import pandas as pd
import os
import glob
import numpy as np
import shutil

# ==========================================
# CONFIGURE YOUR PATHS HERE
# ==========================================
SOURCE_FOLDER = '../Data-Extraction/processed'      # Where your original CSVs are
TEMP_FOLDER = '../temp_processing'    # Temporary workspace
# ==========================================

def strict_repair_and_interpolate():
    # Setup folders
    if not os.path.exists(TEMP_FOLDER):
        os.makedirs(TEMP_FOLDER)

    # 1. Copy to Temp for safety
    csv_files_source = glob.glob(os.path.join(SOURCE_FOLDER, "*.csv"))
    if not csv_files_source:
        print("No CSV files found in the source folder!")
        return
        
    for f in csv_files_source:
        shutil.copy(f, TEMP_FOLDER)

    temp_files = sorted(glob.glob(os.path.join(TEMP_FOLDER, "*.csv")))
    all_dfs = []

    print("Step 1: Reading files and unifying headers...")
    for f in temp_files:
        temp_df = pd.read_csv(f)
        temp_df.columns = temp_df.columns.str.strip().str.upper()
        temp_df['_source_filename'] = os.path.basename(f) 
        all_dfs.append(temp_df)

    # Create the master table
    master_df = pd.concat(all_dfs, axis=0, ignore_index=True, sort=False)

    # 2. THE TERMINATION: Keep only columns found in >= 20 files
    col_presence = master_df.groupby('_source_filename').count().astype(bool).sum()
    keep_cols = col_presence[col_presence >= 20].index.tolist()
    
    if '_source_filename' not in keep_cols:
        keep_cols.append('_source_filename')
    
    # Drop all other columns from the dataset
    master_df = master_df[keep_cols]
    print(f"Kept {len(keep_cols)-1} columns. Deleted {len(col_presence) - len(keep_cols)} low-frequency columns.")

    # 3. CLEANING & INTERPOLATION
    print("Step 2: Cleaning and Interpolating...")
    
    # Labels we don't want to turn into numbers
    labels = ['NAMEOFMONITORINGLOCATION', 'USEBASEDCLASS', 'SAMPLINGMONTH', 'STN_CODE', '_source_filename']

    for col in master_df.columns:
        if col in labels:
            # For text labels, fill missing values with the nearest neighbor
            master_df[col] = master_df[col].ffill().bfill()
            continue
            
        # For numeric parameters (BOD, PH, etc.):
        # 1. Convert to string and extract numbers (removes "(BDL)", "mg/L", etc.)
        # 2. Convert to float
        # 3. Interpolate
        master_df[col] = master_df[col].astype(str).str.extract(r'([-+]?\d*\.\d+|\d+)').astype(float)
        
        # Linear interpolation across the sequence of files
        master_df[col] = master_df[col].interpolate(method='linear', limit_direction='both')
        
        # Fill any remaining NaNs (if a column was empty across all files) with 0
        master_df[col] = master_df[col].fillna(0)

    # 4. OVERWRITE ORIGINALS
    print("Step 3: Saving cleaned files...")
    for f_name in master_df['_source_filename'].unique():
        file_data = master_df[master_df['_source_filename'] == f_name].copy()
        file_data.drop(columns=['_source_filename'], inplace=True)
        
        final_dest = os.path.join(SOURCE_FOLDER, f_name)
        file_data.to_csv(final_dest, index=False)
        print(f"Updated: {f_name}")

    shutil.rmtree(TEMP_FOLDER)
    print("\nProcess Complete. All files now have identical headers (Freq >= 20).")

if __name__ == "__main__":
    strict_repair_and_interpolate()