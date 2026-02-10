import pandas as pd

# ==========================================
# CONFIGURE YOUR FILENAMES HERE
# ==========================================
INPUT_FILE = 'Master_Dataset.csv'
OUTPUT_FILE = 'Master_Dataset_Sorted.csv'
# ==========================================

def sort_master_chronologically():
    print(f"Loading {INPUT_FILE}...")
    df = pd.read_csv(INPUT_FILE)

    # 1. Create a helper column to handle the date logic
    # We specify the format '%B-%y' (e.g., August-23)
    # %B = Full month name, %y = 2-digit year
    try:
        df['TEMP_DATE'] = pd.to_datetime(df['FILE_DATE_TAG'], format='%B-%y')
    except Exception as e:
        print("Error: The date format in FILE_DATE_TAG doesn't match 'Month-Year'.")
        print(f"Details: {e}")
        return

    # 2. Sort the entire dataframe by this real date
    # This ensures 2023 comes before 2024, and January comes before February
    print("Sorting data chronologically...")
    df_sorted = df.sort_values(by=['TEMP_DATE', 'STN_CODE']).reset_index(drop=True)

    # 3. Remove the temporary helper column
    df_sorted.drop(columns=['TEMP_DATE'], inplace=True)

    # 4. Save the sorted master document
    df_sorted.to_csv(OUTPUT_FILE, index=False)
    
    print(f"\nSuccess! The file is now sorted by date.")
    print(f"Saved as: {OUTPUT_FILE}")
    
    # Show the order for confirmation
    print("\nChronological order of data:")
    print(df_sorted['FILE_DATE_TAG'].unique())

if __name__ == "__main__":
    sort_master_chronologically()