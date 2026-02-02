import pandas as pd
import os
from collections import defaultdict

def analyze_lake_parameters(folder_path):
    # Dictionary to store: parameter_name -> list of filenames where it exists
    param_map = defaultdict(list)
    all_files = [f for f in os.listdir(folder_path) if f.endswith('.csv')]
    
    if not all_files:
        print("No CSV files found in the specified directory.")
        return

    # 1. Parse all files and map parameters
    for filename in all_files:
        file_path = os.path.join(folder_path, filename)
        try:
            # Assuming the first column contains the parameter names
            df = pd.read_csv(file_path)
            
            # Cleaning: Get the first column, drop NaNs, strip whitespace
            params_in_file = df.iloc[:, 0].dropna().astype(str).str.strip().unique()
            
            for param in params_in_file:
                param_map[param].append(filename)
        except Exception as e:
            print(f"Error reading {filename}: {e}")

    # 2. Generate the Report
    report_data = []
    total_files_count = len(all_files)

    for param, files_present in param_map.items():
        count = len(files_present)
        missing_files = list(set(all_files) - set(files_present))
        
        report_data.append({
            "Parameter": param,
            "Count": count,
            "Presence (%)": round((count / total_files_count) * 100, 2),
            "Missing In": ", ".join(missing_files) if missing_files else "None (Present in all)"
        })

    # 3. Display as a DataFrame for easy viewing
    report_df = pd.DataFrame(report_data)
    
    # Sort by count descending so you see the most common parameters first
    report_df = report_df.sort_values(by="Count", ascending=False)
    
    return report_df

    # --- USAGE ---
    # Replace 'your_folder_path' with the actual path to your CSVs
    folder_path = '/mnt/c/Users/satya/OneDrive - iiit-b/My_files/Semester_6/PE - Uttam Kumar/Correlation-Expression-Prediction/Data-Extraction'
    report = analyze_lake_parameters(folder_path)
    print(report.to_string(index=False))

    # Optional: Save the report to a CSV for your EDA documentation
    # report.to_csv('parameter_inventory_report.csv', index=False)