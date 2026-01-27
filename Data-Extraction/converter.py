import pandas as pd

excel_file = "Sep-25.xlsx"
xlsx = pd.ExcelFile(excel_file)

for sheet in xlsx.sheet_names:
    df = pd.read_excel(excel_file, sheet_name=sheet, dtype=str)  # read as strings to avoid loss
    csv_file = "Sep-25.csv"
    df.to_csv(csv_file, index=False, encoding="utf-8")
    print(f"Converted: {sheet} -> {csv_file}")
