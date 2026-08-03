import argparse
import json
import os
import re

import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)


# ==========================================
# COMMAND-LINE ARGUMENTS
# ==========================================

parser = argparse.ArgumentParser()

parser.add_argument("--csv", required=True)
parser.add_argument("--state", required=True)
parser.add_argument("--district", required=True)
parser.add_argument("--market", required=True)
parser.add_argument("--commodity", required=True)

args = parser.parse_args()


# ==========================================
# SAFE FILE NAME
# ==========================================

def safe_name(value):
    value = value.lower().strip()

    value = re.sub(
        r"[^a-z0-9]+",
        "_",
        value
    )

    return value.strip("_")


model_name = (
    f"{safe_name(args.state)}_"
    f"{safe_name(args.district)}_"
    f"{safe_name(args.market)}_"
    f"{safe_name(args.commodity)}"
)

model_dir = os.path.join(
    "ml",
    "models"
)

os.makedirs(
    model_dir,
    exist_ok=True
)

model_path = os.path.join(
    model_dir,
    f"{model_name}.joblib"
)


# ==========================================
# LOAD DATA
# ==========================================

df = pd.read_csv(args.csv)

required_columns = [
    "arrivalDate",
    "minPrice",
    "modalPrice",
    "maxPrice",
]

missing = [
    column
    for column in required_columns
    if column not in df.columns
]

if missing:
    raise ValueError(
        f"Missing columns: {missing}"
    )


df["arrivalDate"] = pd.to_datetime(
    df["arrivalDate"],
    utc=True,
    errors="coerce"
)

for column in [
    "minPrice",
    "modalPrice",
    "maxPrice",
]:
    df[column] = pd.to_numeric(
        df[column],
        errors="coerce"
    )


df = (
    df.dropna(
        subset=required_columns
    )
    .sort_values("arrivalDate")
    .drop_duplicates(
        subset=["arrivalDate"],
        keep="last"
    )
    .reset_index(drop=True)
)


# ==========================================
# MINIMUM DATA REQUIREMENT
# ==========================================

MIN_RECORDS = 100

if len(df) < MIN_RECORDS:
    result = {
        "success": False,
        "reason": "INSUFFICIENT_DATA",
        "message":
            "At least 100 historical records are required",
        "records": len(df),
    }

    print(json.dumps(result))
    raise SystemExit(2)


# ==========================================
# FEATURE ENGINEERING
# ==========================================

df["lag_1"] = (
    df["modalPrice"].shift(1)
)

df["lag_2"] = (
    df["modalPrice"].shift(2)
)

df["lag_3"] = (
    df["modalPrice"].shift(3)
)

df["rolling_3"] = (
    df["modalPrice"]
    .shift(1)
    .rolling(3)
    .mean()
)

df["rolling_7"] = (
    df["modalPrice"]
    .shift(1)
    .rolling(7)
    .mean()
)

df["month"] = (
    df["arrivalDate"].dt.month
)

df["day_of_week"] = (
    df["arrivalDate"].dt.dayofweek
)

df = (
    df.dropna()
    .reset_index(drop=True)
)


features = [
    "minPrice",
    "maxPrice",
    "lag_1",
    "lag_2",
    "lag_3",
    "rolling_3",
    "rolling_7",
    "month",
    "day_of_week",
]

X = df[features]

y = df["modalPrice"]


# ==========================================
# TIME-ORDERED SPLIT
# ==========================================

split_index = int(
    len(df) * 0.8
)

X_train = X.iloc[:split_index]
X_test = X.iloc[split_index:]

y_train = y.iloc[:split_index]
y_test = y.iloc[split_index:]


# ==========================================
# TRAIN
# ==========================================

model = RandomForestRegressor(
    n_estimators=300,
    max_depth=10,
    random_state=42,
    n_jobs=-1,
)

model.fit(
    X_train,
    y_train
)


# ==========================================
# EVALUATE
# ==========================================

predictions = model.predict(
    X_test
)

mae = mean_absolute_error(
    y_test,
    predictions
)

rmse = np.sqrt(
    mean_squared_error(
        y_test,
        predictions
    )
)

r2 = r2_score(
    y_test,
    predictions
)


# ==========================================
# SAVE MODEL + METADATA
# ==========================================

joblib.dump(
    {
        "model": model,

        "features": features,

        "state": args.state,
        "district": args.district,
        "market": args.market,
        "commodity": args.commodity,

        "records": len(df),

        "metrics": {
            "mae": float(mae),
            "rmse": float(rmse),
            "r2": float(r2),
        },

        "lastHistoricalDate":
            df["arrivalDate"]
            .iloc[-1]
            .strftime("%Y-%m-%d"),
    },
    model_path
)


# ==========================================
# JSON RESULT
# ==========================================

result = {
    "success": True,

    "state": args.state,
    "district": args.district,
    "market": args.market,
    "commodity": args.commodity,

    "records": len(df),

    "trainingSamples":
        len(X_train),

    "testingSamples":
        len(X_test),

    "modelPath":
        model_path.replace("\\", "/"),

    "metrics": {
        "mae": round(
            float(mae),
            2
        ),

        "rmse": round(
            float(rmse),
            2
        ),

        "r2": round(
            float(r2),
            4
        ),
    }
}

print(
    json.dumps(
        result,
        indent=2
    )
)