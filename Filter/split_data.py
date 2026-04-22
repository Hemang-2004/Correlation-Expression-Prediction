import pandas as pd
import os

# 1. Load the merged dataset
# This file contains both your Sentinel bands and your Ground Truth (DO, BOD, etc.)
input_file = 'Merged_Lake_Water_Quality_Master.csv'
df = pd.read_csv(input_file)

# 2. Preparation: Fix dates and create a monthly grouping key
df['scene_date'] = pd.to_datetime(df['scene_date'])
df['month_year_key'] = df['scene_date'].dt.strftime('%Y-%m')

# 3. Chronological Ranking
# We sort by Lake and Date so that 'cumcount' assigns 1 to the earliest date of the month
df = df.sort_values(['LAKE_NAME_GEE', 'scene_date'])

# Assign pass numbers (1, 2, 3, 4, 5...) per lake per month
df['pass_number'] = df.groupby(['LAKE_NAME_GEE', 'month_year_key']).cumcount() + 1

# 4. Create Output Directory
output_dir = 'Splitted_data'
if not os.path.exists(output_dir):
    os.makedirs(output_dir)
    print(f"Created directory: {output_dir}")

# 5. Split into 5 files and Save
print("--- Splitting Process Started ---")
for i in range(1, 6):
    # Filter for the specific pass number
    sub_df = df[df['pass_number'] == i].copy()
    
    if not sub_df.empty:
        # Drop the temporary helper columns before saving to keep the file clean
        sub_df = sub_df.drop(columns=['month_year_key', 'pass_number'])
        
        filename = f'{output_dir}/Sentinel_Pass_{i}_Dataset.csv'
        sub_df.to_csv(filename, index=False)
        print(f"✅ Success: Pass {i} saved | {len(sub_df)} rows | -> {filename}")
    else:
        print(f"ℹ️ Note: No data found for Pass {i} (common in cloudy months)")

print("--- Splitting Complete ---")