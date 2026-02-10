import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np
from math import pi

# 1. Load and Setup
df = pd.read_csv('Master_Dataset_Sorted.csv')
df['DATE'] = pd.to_datetime(df['FILE_DATE_TAG'], format='%B-%y')
# Extract Month number for seasonal grouping
df['MONTH_NUM'] = df['DATE'].dt.month 

# --- PLOT 1: SEASONAL POLLUTION INTENSITY (Heatmap) ---
# Shows which parameters spike in which months across the whole city
plt.figure(figsize=(12, 8))
seasonal_data = df.groupby('MONTH_NUM')[['BOD', 'COD', 'NITRATE_N', 'TOTAL_COLI', 'CONDUCTIVITY']].mean()
# Normalize for the heatmap so we can compare different units
seasonal_norm = (seasonal_data - seasonal_data.min()) / (seasonal_data.max() - seasonal_data.min())
sns.heatmap(seasonal_norm.T, annot=True, cmap="YlOrRd", cbar_kws={'label': 'Normalized Intensity'})
plt.title("Seasonal Pollution Fingerprint (Normalized)", fontsize=14)
plt.xlabel("Month of Year")
plt.savefig('seasonal_fingerprint.png')

# --- PLOT 2: THE "OPTICAL CLARITY" JOINT PLOT ---
# Satellites "see" Turbidity and TDS best. This shows their relationship to Oxygen levels.
g = sns.jointplot(data=df, x='TOTALDISSOLVEDSOLIDS', y='DO', kind="hex", color="#4CB391")
g.fig.suptitle("Density Mapping: TDS vs. Dissolved Oxygen", y=1.02)
plt.savefig('tds_do_joint.png')

# --- PLOT 3: RIDGE PLOT (Joyplot) OF pH BY MONTH ---
# Visualizes the "shift" in water chemistry across the timeline
plt.figure(figsize=(10, 8))
sns.kdeplot(data=df, x="PH", hue="FILE_DATE_TAG", fill=True, common_norm=False, palette="viridis", alpha=.5, linewidth=0)
plt.title("pH Distribution Shift Over the Sampling Timeline")
plt.savefig('ph_ridge_plot.png')

# --- PLOT 4: FACET GRID - STN WISE PERFORMANCE ---
# Pick top 5 stations to see how they deviate from each other
top_stns = df['NAMEOFMONITORINGLOCATION'].value_counts().nlargest(5).index
df_sub = df[df['NAMEOFMONITORINGLOCATION'].isin(top_stns)]

g = sns.FacetGrid(df_sub, col="NAMEOFMONITORINGLOCATION", col_wrap=3, height=4)
g.map(sns.scatterplot, "BOD", "DO", alpha=.7)
g.add_legend()
plt.savefig('station_facet_comparison.png')

# --- PLOT 5: RADAR CHART (Average Profile) ---
# Shows the "shape" of your water quality variables
categories = ['DO', 'PH', 'BOD', 'NITRATE_N', 'CONDUCTIVITY']
values = df[categories].mean()
# Simple normalization to 0-1 for radar display
values = (values - df[categories].min()) / (df[categories].max() - df[categories].min())
values = values.tolist()
values += values[:1] # Repeat first value to close the circle

angles = [n / float(len(categories)) * 2 * pi for n in range(len(categories))]
angles += angles[:1]

fig, ax = plt.subplots(figsize=(6, 6), subplot_kw=dict(polar=True))
ax.fill(angles, values, 'b', alpha=0.1)
ax.plot(angles, values, linewidth=2, linestyle='solid')
ax.set_xticks(angles[:-1])
ax.set_xticklabels(categories)
plt.title("Overall Water Quality Radar Profile")
plt.savefig('water_quality_radar.png')

# --- PLOT 6: HIERARCHICAL CLUSTERING (Clustermap) ---
# Groups both months and parameters together by similarity
sns.clustermap(df[['DO', 'PH', 'CONDUCTIVITY', 'BOD', 'NITRATE_N', 'COD']].corr(), 
               annot=True, cmap='mako', figsize=(8, 8))
plt.savefig('parameter_clustering.png')