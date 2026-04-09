import pandas as pd
import os
import re
from collections import defaultdict

def generate_clean_key(raw_header):
    """
    Uses regex to create a standard key for the messy headers. 
    We can then group the similar columns together
    """

    #Step 1: Make everything lowercase and remove units and special chars 
    clean = raw_header.lower()
    #clean = re.sub()
    clean = re.sub(r'\(.*?\)', '', clean)  # Remocing everything in brackets
    #\( \) represents brackets, . is for any char and.* means any character of any length (zero or more)
    #? makes it stop at the first closing bracket it finds and then goes to the next open bracket 
    #otherwise for some parameter in between the brackets like (something) Turbidity (something)
    #we will end up with Turbidity only 
    clean = re.sub(r'[^a-z0-9]', '', clean) # Removing non alpha-numerics

    #Step 2: Some manual regex overrides
    if re.search(r'temp', clean): return 'TEMP'
    if re.search(r'dissolvedo2|do2', clean): return 'DO'
    if re.search(r'conduct', clean): return 'CONDUCTIVITY'
    if re.search(r'fecal.*coli', clean): return 'FECAL_COLI'
    if re.search(r'total.*coli', clean): return 'TOTAL_COLI'
    if re.search(r'nitrate', clean): return 'NITRATE_N'
    if re.search(r'bicarb', clean): return 'BICARBONATE'
    if re.search(r'stn|station', clean): return 'STN_CODE'

    #Step 3: Finally return everything in upper-case
    return clean.upper()


def discover_headers(folder_path):
    all_headers = defaultdict(set)
    all_files = [f for f in os.listdir(folder_path) if f.endswith('.csv')]
    
    print(f"Scanning {len(all_files)} files...")

    for filename in all_files:
        file_path = os.path.join(folder_path, filename)
        try:
            # Read only first row to get columns
            df = pd.read_csv(file_path, nrows=0)
            for col in df.columns:
                col_strip = col.strip()
                if "Unnamed" not in col_strip and col_strip != "":
                    # Map the raw header to a suggested clean key
                    clean_key = generate_clean_key(col_strip)
                    all_headers[clean_key].add(col_strip)
        except Exception as e:
            print(f"Error reading {filename}: {e}")

    # Create a report 
    print("\n--- HEADER MAPPING DISCOVERY REPORT ---")
    print(f"{'SUGGESTED KEY':<20} | {'RAW VARIATIONS FOUND'}")
    print("-" * 60)
    
    mapping_dict = {}
    for key, variations in sorted(all_headers.items()):
        print(f"{key:<20} | {list(variations)}")
        mapping_dict[key] = list(variations)
        
    return mapping_dict

if __name__ == "__main__":
    # Use your specific WSL path
    path = 'Correlation-Expression-Prediction/Data-Extraction'
    
    final_map = discover_headers(path)
    
    # Optional: Save this as a JSON or Python file to use as your 'Source of Truth'
    import json
    with open('header_mapping.json', 'w') as f:
        json.dump(final_map, f, indent=4)
    print(f"\nSaved mapping to 'header_mapping.json'")

    