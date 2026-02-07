import pandas as pd
import os
import json
from pathlib import Path

def run_header_update(data_dir, mapping_path):
    # Load standardized mapping
    with open(mapping_path, 'r') as f:
        schema = json.load(f)

    # Create lookup for faster renaming
    lookup = {variant: key for key, variants in schema.items() for variant in variants}

    # Setup output directory in CWD
    output_dir = Path.cwd() / "processed"
    output_dir.mkdir(exist_ok=True)

    source_path = Path(data_dir)
    files = list(source_path.glob("*.csv"))
    
    print(f"Processing {len(files)} files found in {data_dir}...")

    for fpath in files:
        try:
            df = pd.read_csv(fpath)
            initial_cols = list(df.columns)
            
            # Map headers to standardized keys
            df = df.rename(columns=lookup)
            
            # Save to the new processed folder
            df.to_csv(output_dir / fpath.name, index=False)
            
            # Sanity check: count should never change during a rename
            success = len(initial_cols) == len(df.columns)
            result_tag = "[OK]" if success else "[COLUMN MISMATCH]"
            
            print(f"{fpath.name:<25} | {len(initial_cols)} -> {len(df.columns)} columns {result_tag}")

            # Identify headers that didn't match any key in your JSON
            unmatched = [c for c in df.columns if c not in schema.keys()]
            if len(unmatched) > 5:
                print(f"    Check: {len(unmatched)} headers remain unmapped. Examples: {unmatched[:3]}")

        except Exception as err:
            print(f"Failed to process {fpath.name}: {err}")

if __name__ == "__main__":
    # Internal paths
    DATA_ROOT = 'Correlation-Expression-Prediction/Data-Extraction'
    MAP_FILE = 'refined_header_mapping.json'
    
    run_header_update(DATA_ROOT, MAP_FILE)