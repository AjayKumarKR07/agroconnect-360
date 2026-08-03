import sys
import json
import joblib
import pandas as pd


MODEL_PATH = "ml/bangarpet_tomato_model.joblib"
CSV_PATH = "ml/bangarpet_tomato.csv"


# ==========================================
# LOAD MODEL
# ==========================================

saved = joblib.load(MODEL_PATH)

model = saved["model"]
features = saved["features"]


# ==========================================
# LOAD HISTORICAL DATA
# ==========================================

df = pd.read_csv(CSV_PATH)

df["arrivalDate"] = pd.to_datetime(
    df["arrivalDate"],
    utc=True
)

df = (
    df.sort_values("arrivalDate")
    .reset_index(drop=True)
)


# ==========================================
# FORECAST SETTINGS
# ==========================================

days_to_predict = 7

future_predictions = []

price_history = (
    df["modalPrice"]
    .astype(float)
    .tolist()
)

last_date = df["arrivalDate"].iloc[-1]

last_min = float(
    df["minPrice"].iloc[-1]
)

last_max = float(
    df["maxPrice"].iloc[-1]
)


# ==========================================
# RECURSIVE 7-DAY FORECAST
# ==========================================

for day in range(1, days_to_predict + 1):

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

    row = pd.DataFrame(
        [
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
        ]
    )

    row = row[features]

    predicted_price = float(
        model.predict(row)[0]
    )

    predicted_price = round(
        predicted_price,
        2
    )

    future_predictions.append(
        {
            "date":
                future_date.strftime(
                    "%Y-%m-%d"
                ),
            "predictedPrice":
                predicted_price,
        }
    )

    # Recursive prediction:
    # today's prediction becomes
    # historical input for next day
    price_history.append(
        predicted_price
    )


# ==========================================
# TREND
# ==========================================

first_prediction = (
    future_predictions[0][
        "predictedPrice"
    ]
)

last_prediction = (
    future_predictions[-1][
        "predictedPrice"
    ]
)

difference = (
    last_prediction -
    first_prediction
)

if difference > 50:
    trend = "rising"

elif difference < -50:
    trend = "falling"

else:
    trend = "stable"


# ==========================================
# JSON OUTPUT
# ==========================================

result = {
    "success": True,

    "market": "Bangarpet APMC",
    "commodity": "Tomato",

    "unit": "quintal",

    "lastHistoricalPrice":
        float(
            df["modalPrice"].iloc[-1]
        ),

    "lastHistoricalDate":
        last_date.strftime(
            "%Y-%m-%d"
        ),

    "trend": trend,

    "forecast":
        future_predictions,
}


print(
    json.dumps(
        result,
        indent=2
    )
)