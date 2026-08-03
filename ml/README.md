# AgroConnect-360 — ML Price Prediction Service

## Overview
RandomForest-based commodity price prediction models trained on APMC mandi historical data from Karnataka.

## Setup
```bash
pip install -r requirements.txt
```

## Models Available
| Model File | Commodity | Mandi |
|------------|-----------|-------|
| `karnataka_kolar_bangarpet_apmc_tomato.joblib` | Tomato | Bangarpet APMC |
| `karnataka_mysuru_mysuru_apmc_tomato.joblib` | Tomato | Mysuru APMC |

## Usage

### Train a model
```bash
python train_price_model.py
python train_dynamic_model.py
```

### Predict price
```bash
# Basic prediction
python predict_price.py

# Dynamic multi-model prediction
python predict_dynamic.py --state Karnataka --district Kolar --market Bangarpet --commodity Tomato
```

## Data Sources
- APMC mandi arrival data: [data.gov.in](https://data.gov.in)
- Minimum Support Prices (MSP): Ministry of Agriculture, GoI
- Weather data: OpenWeatherMap historical API

## Notes
- Model binaries (`*.joblib`) are excluded from Git (large files)
- Run training scripts to regenerate models from source data
