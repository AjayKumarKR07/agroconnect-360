import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
import joblib


# ==========================================
# LOAD DATA
# ==========================================

df = pd.read_csv("ml/bangarpet_tomato.csv")

df["arrivalDate"] = pd.to_datetime(
    df["arrivalDate"]
)

df = df.sort_values("arrivalDate").reset_index(
    drop=True
)


# ==========================================
# FEATURE ENGINEERING
# ==========================================

df["lag_1"] = df["modalPrice"].shift(1)
df["lag_2"] = df["modalPrice"].shift(2)
df["lag_3"] = df["modalPrice"].shift(3)

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

df["month"] = df["arrivalDate"].dt.month
df["day_of_week"] = (
    df["arrivalDate"].dt.dayofweek
)

df = df.dropna().reset_index(drop=True)


# ==========================================
# FEATURES + TARGET
# ==========================================

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
# TIME-ORDERED TRAIN / TEST SPLIT
# ==========================================

split_index = int(len(df) * 0.8)

X_train = X.iloc[:split_index]
X_test = X.iloc[split_index:]

y_train = y.iloc[:split_index]
y_test = y.iloc[split_index:]


# ==========================================
# TRAIN MODEL
# ==========================================

model = RandomForestRegressor(
    n_estimators=300,
    max_depth=10,
    random_state=42,
)

model.fit(X_train, y_train)


# ==========================================
# EVALUATION
# ==========================================

predictions = model.predict(X_test)

mae = mean_absolute_error(
    y_test,
    predictions,
)

rmse = np.sqrt(
    mean_squared_error(
        y_test,
        predictions,
    )
)

r2 = r2_score(
    y_test,
    predictions,
)

print("\n==============================")
print("AgroConnect 360 Price Model")
print("==============================")

print(f"Total samples : {len(df)}")
print(f"Training      : {len(X_train)}")
print(f"Testing       : {len(X_test)}")

print("\nModel Performance")
print("------------------------------")

print(f"MAE  : {mae:.2f}")
print(f"RMSE : {rmse:.2f}")
print(f"R²   : {r2:.4f}")


# ==========================================
# SAVE MODEL
# ==========================================

joblib.dump(
    {
        "model": model,
        "features": features,
    },
    "ml/bangarpet_tomato_model.joblib",
)

print(
    "\nModel saved: "
    "ml/bangarpet_tomato_model.joblib"
)