import pandas as pd
import os
import glob

# ==========================================
# CONFIGURE YOUR PATHS HERE
# ==========================================
SOURCE_FOLDER = '../Data-Extraction/processed'  # Folder from your image
OUTPUT_FILE = 'Master_Dataset.csv'
# ==========================================

def consolidate_to_master():
    # 1. Get all CSV files in the directory
    csv_files = glob.glob(os.path.join(SOURCE_FOLDER, "*.csv"))
    
    if not csv_files:
        print(f"No files found in {SOURCE_FOLDER}. Please check the path.")
        return

    all_dataframes = []

    print(f"Starting consolidation of {len(csv_files)} files...")

    for file_path in csv_files:
        # Extract the filename without the extension (e.g., 'August-24')
        file_name = os.path.basename(file_path)
        date_label = os.path.splitext(file_name)[0]
        
        try:
            # Read the CSV
            df = pd.read_csv(file_path)
            
            # 2. Add the month-year column as the first column
            # This ensures every row is tagged with its source month
            df.insert(0, 'FILE_DATE_TAG', date_label)
            
            all_dataframes.append(df)
            print(f"Processed: {file_name}")
            
        except Exception as e:
            print(f"Error reading {file_name}: {e}")

    # 3. Combine all dataframes into one
    # Using sort=False preserves the column order of the first file
    master_df = pd.concat(all_dataframes, axis=0, ignore_index=True, sort=False)

    # 4. Save the final master CSV
    master_df.to_csv(OUTPUT_FILE, index=False)
    
    print("\n--- Consolidation Complete ---")
    print(f"Master file saved as: {OUTPUT_FILE}")
    print(f"Total rows: {len(master_df)}")
    print(f"Total columns: {len(master_df.columns)}")

if __name__ == "__main__":
    consolidate_to_master()