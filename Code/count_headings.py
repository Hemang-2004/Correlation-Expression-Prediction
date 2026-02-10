import pandas as pd
import os
from collections import Counter

def analyze_csv_columns(folder_path):
    # Initialize a Counter to track header occurrences across all files
    total_header_tally = Counter()
    file_details = []

    # Loop through files in the directory
    for filename in os.listdir(folder_path):
        if filename.endswith('.csv'):
            file_path = os.path.join(folder_path, filename)
            
            try:
                # Read only the header row to save memory/time
                df = pd.read_csv(file_path, nrows=0)
                headers = df.columns.tolist()
                
                # Record details for this specific file
                file_details.append({
                    'File Name': filename,
                    'Column Count': len(headers)
                })
                
                # Update the global tally
                total_header_tally.update(headers)
                
            except Exception as e:
                print(f"Could not read {filename}: {e}")

    # --- Output Results ---
    
    print(f"\n{'--- File Breakdowns ---':<30}")
    for detail in file_details:
        print(f"{detail['File Name']}: {detail['Column Count']} columns")

    print(f"\n{'--- Global Header Frequency ---':<30}")
    # Sort by most common occurrence
    for header, count in total_header_tally.most_common():
        print(f"{header}: found in {count} files")

# Usage
# Change 'your_folder_path_here' to your actual folder path
folder_path = '../Data-Extraction/processed' 
analyze_csv_columns(folder_path)