import pandas as pd
import os
from collections import defaultdict

def analyze_lake_columns(folder_path):
    # Dictionary to store: column_name -> list of filenames where it exists
    column_map = defaultdict(list)
    all_files = [f for f in os.listdir(folder_path) if f.endswith('.csv')]
    
    if not all_files:
        print(f"No CSV files found in: {folder_path}")
        return None

    # 1. Parse all files and extract column headers
    for filename in all_files:
        file_path = os.path.join(folder_path, filename)
        try:
            # Read only the header to save memory and time
            df_header = pd.read_csv(file_path, nrows=0)
            columns_in_file = [str(col).strip() for col in df_header.columns]
            
            for col in columns_in_file:
                # Filter out 'Unnamed' or empty columns
                if "Unnamed" not in col and col != "":
                    column_map[col].append(filename)
        except Exception as e:
            print(f"Error reading {filename}: {e}")

    # 2. Generate the Report
    report_data = []
    total_files_count = len(all_files)

    for col_name, files_present in column_map.items():
        count = len(files_present)
        missing_files = list(set(all_files) - set(files_present))
        
        report_data.append({
            "Parameter (Heading)": col_name,
            "Count": count,
            "Presence (%)": round((count / total_files_count) * 100, 2),
            "Missing In": ", ".join(missing_files) if missing_files else "None (Universal)"
        })

    # 3. Create DataFrame and sort by presence
    report_df = pd.DataFrame(report_data)
    report_df = report_df.sort_values(by="Count", ascending=False)
    
    return report_df

if __name__ == "__main__":
    # Your WSL Path
    path = '/mnt/c/Users/satya/OneDrive - iiit-b/My_files/Semester_6/PE - Uttam Kumar/Correlation-Expression-Prediction/Data-Extraction'
    
    print("Analyzing Column Headings across all files...")
    report = analyze_lake_columns(path)
    
    if report is not None:
        print("\n--- COLUMN HEADINGS INVENTORY ---")
        # Showing top 30 parameters
        print(report.head(30).to_string(index=False))
        
        # Save to CSV for full inspection
        report.to_csv('column_inventory_report.csv', index=False)
        print(f"\nFull report saved to 'column_inventory_report.csv'")