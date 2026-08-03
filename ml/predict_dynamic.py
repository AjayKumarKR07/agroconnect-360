import argparse
import json
import re
import os

import joblib
import pandas as pd


# ==========================================
# ARGUMENTS
# ==========================================

parser = argparse.ArgumentParser()

parser.add_argument("--csv", required=True)
parser.add_argument("--state", required=True)
parser.add_argument("--district", required=True)
parser.add_argument("--market", required=True)
parser.add_argument("--commodity", required=True)
parser.add_argument("--days", type=int, default=7)

args = parser.parse_args()


# ==========================================
# SAFE MODEL NAME
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

model_path = os.path.join(
    "ml",
    "models",
    f"{model_name}.joblib"
)


# ==========================================
# CHECK MODEL
# ==========================================

if not os.path.exists(model_path):
    print(
        json.dumps({
            "success": False,
            "reason": "MODEL_NOT_FOUND",
            "message":
                "Prediction model has not been trained for this market and commodity.",
        })
    )

    raise SystemExit(2)


# ==========================================
# LOAD MODEL
# ==========================================

saved = joblib.load(model_path)

model = saved["model"]
features = saved["features"]


# ==========================================
# LOAD HISTORY
# ==========================================

df = pd.read_csv(args.csv)

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
        subset=[
            "arrivalDate",
            "minPrice",
            "modalPrice",
            "maxPrice",
        ]
    )
    .sort_values("arrivalDate")
    .drop_duplicates(
        subset=["arrivalDate"],
        keep="last"
    )
    .reset_index(drop=True)
)


if len(df) < 7:
    print(
        json.dumps({
            "success": False,
            "reason": "INSUFFICIENT_HISTORY",
            "message":
                "At least 7 historical observations are required for prediction.",
        })
    )

    raise SystemExit(2)


# ==========================================
# PREPARE HISTORY
# ==========================================

price_history = (
    df["modalPrice"]
    .astype(float)
    .tolist()
)

last_date = (
    df["arrivalDate"].iloc[-1]
)

last_min = float(
    df["minPrice"].iloc[-1]
)

last_max = float(
    df["maxPrice"].iloc[-1]
)

last_price = float(
    df["modalPrice"].iloc[-1]
)


# ==========================================
# FORECAST
# ==========================================

forecast = []

for day in range(
    1,
    args.days + 1
):

    future_date = (
        last_date +
        pd.Timedelta(days=day)
    )

    lag_1 = price_history[-1]
    lag_2 = price_history[-2]
    lag_3 = price_history[-3]

    rolling_3 = (
        sum(price_history[-3:]) / 3
    )

    rolling_7 = (
        sum(price_history[-7:]) / 7
    )

    row = pd.DataFrame([
        {
            "minPrice": last_min,
            "maxPrice": last_max,
            "lag_1": lag_1,
            "lag_2": lag_2,
            "lag_3": lag_3,
            "rolling_3": rolling_3,
            "rolling_7": rolling_7,
            "month": future_date.month,
            "day_of_week":
                future_date.dayofweek,
        }
    ])

    row = row[features]

    predicted_price = float(
        model.predict(row)[0]
    )

    predicted_price = round(
        predicted_price,
        2
    )

    forecast.append({
        "date":
            future_date.strftime(
                "%Y-%m-%d"
            ),

        "predictedPrice":
            predicted_price,
    })

    # Recursive forecasting
    price_history.append(
        predicted_price
    )


# ==========================================
# TREND
# ==========================================

first_price = (
    forecast[0]["predictedPrice"]
)

last_forecast_price = (
    forecast[-1]["predictedPrice"]
)

change = (
    last_forecast_price -
    first_price
)

change_percent = (
    (change / first_price) * 100
    if first_price
    else 0
)


if change_percent > 5:
    trend = "rising"

elif change_percent < -5:
    trend = "falling"

else:
    trend = "stable"


# ==========================================
# RESULT
# ==========================================

result = {
    "success": True,

    "state": args.state,
    "district": args.district,
    "market": args.market,
    "commodity": args.commodity,

    "unit": "quintal",

    "lastHistoricalDate":
        last_date.strftime(
            "%Y-%m-%d"
        ),

    "lastHistoricalPrice":
        last_price,

    "trend": trend,

    "forecastChangePercent":
        round(change_percent, 2),

    "forecast": forecast,

    "model": {
        "algorithm":
            "Random Forest Regressor",

        "records":
            saved.get("records"),

        "metrics":
            saved.get("metrics"),
    },
}

print(
    json.dumps(
        result,
        indent=2
    )
)