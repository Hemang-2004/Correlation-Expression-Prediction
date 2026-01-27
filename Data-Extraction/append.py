import pandas as pd

df = pd.read_csv("Sep-25.csv")

df["Year"] = 2025   # add year column

df.to_csv("September-25.csv", index=False)
