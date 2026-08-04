import os
import pandas as pd

excel_path = os.path.join("ml", "Agriculture_price_dataset_unclean_full_more_messy.xlsx")
csv_path = os.path.join("ml", "clean_kaggle_mandi_prices.csv")

print(f"Reading Kaggle dataset from {excel_path}...")
df = pd.read_excel(excel_path)

print(f"Original dataset shape: {df.shape}")

# Rename columns to standard names
rename_map = {
    "STATE": "state",
    "District Name": "district",
    "Market Name": "market",
    "Commodity": "commodity",
    "Variety": "variety",
    "Min_Price": "minPrice",
    "Max_Price": "maxPrice",
    "Modal_Price": "modalPrice",
    "Price Date": "arrivalDate"
}

df = df.rename(columns=rename_map)

# Clean text columns
text_cols = ["state", "district", "market", "commodity", "variety"]
for col in text_cols:
    if col in df.columns:
        df[col] = df[col].astype(str).str.strip().str.title()

# Clean price columns
price_cols = ["minPrice", "maxPrice", "modalPrice"]
for col in price_cols:
    if col in df.columns:
        df[col] = pd.to_numeric(df[col], errors="coerce")

# Clean date column
df["arrivalDate"] = pd.to_datetime(df["arrivalDate"], errors="coerce")

# Drop NaNs
df = df.dropna(subset=["state", "district", "commodity", "modalPrice", "arrivalDate"]).reset_index(drop=True)

print(f"Cleaned dataset shape: {df.shape}")

# Save clean CSV
df.to_csv(csv_path, index=False)
print(f"Clean Kaggle mandi price dataset saved to: {csv_path}")
