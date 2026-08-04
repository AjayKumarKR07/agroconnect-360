const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const {
  fetchHistoricalPrices,
} = require("./historicalMandiService");

const MarketPrice = require("../models/MarketPrice");


const MIN_RECORDS = 10;
const MIN_MODEL_R2 = 0.1;

// ==========================================
// GOVERNMENT REFRESH COOLDOWN
// ==========================================

// Avoid repeatedly downloading thousands of
// government records for the same combination.

const GOVERNMENT_REFRESH_COOLDOWN =
  6 * 60 * 60 * 1000; // 6 hours

const governmentRefreshCache =
  new Map();

const getRefreshKey = ({
  state,
  district,
  market,
  commodity,
}) => {
  return [
    state,
    district,
    market,
    commodity,
  ]
    .map((value) =>
      String(value)
        .trim()
        .toLowerCase()
    )
    .join("|");
};

const wasRecentlyRefreshed = (
  key
) => {
  const lastRefresh =
    governmentRefreshCache.get(
      key
    );

  if (!lastRefresh) {
    return false;
  }

  return (
    Date.now() - lastRefresh <
    GOVERNMENT_REFRESH_COOLDOWN
  );
};

const markAsRefreshed = (
  key
) => {
  governmentRefreshCache.set(
    key,
    Date.now()
  );
};

const projectRoot = path.resolve(__dirname, "../..");

const mlDirectory = path.join(
  projectRoot,
  "ml"
);

const tempDirectory = path.join(
  mlDirectory,
  "temp"
);

const modelsDirectory = path.join(
  mlDirectory,
  "models"
);

// Create required directories
fs.mkdirSync(tempDirectory, {
  recursive: true,
});

fs.mkdirSync(modelsDirectory, {
  recursive: true,
});


// ==========================================
// SAFE FILE NAME
// ==========================================

const safeName = (value) => {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};


// ==========================================
// EXECUTE PYTHON
// ==========================================

const runPython = (
  scriptPath,
  args
) => {
  return new Promise(
    (resolve, reject) => {
      execFile(
        "python",
        [scriptPath, ...args],
        {
          cwd: projectRoot,
          timeout: 120000,
          maxBuffer: 10 * 1024 * 1024,
        },
        (error, stdout, stderr) => {
          if (error) {
            console.error(
              "Python stderr:",
              stderr
            );

            // Python may intentionally return
            // JSON before exiting with code 2.
            if (stdout) {
              try {
                const parsed =
                  JSON.parse(stdout);

                return resolve(parsed);
              } catch {
                // Continue to rejection
              }
            }

            return reject(error);
          }

          try {
            const result =
              JSON.parse(stdout);

            resolve(result);
          } catch (parseError) {
            console.error(
              "Python raw output:",
              stdout
            );

            reject(
              new Error(
                "Unable to parse Python response"
              )
            );
          }
        }
      );
    }
  );
};


// ==========================================
// CSV ESCAPING
// ==========================================

const csvValue = (value) => {
  const text =
    value === null ||
    value === undefined
      ? ""
      : String(value);

  return `"${text.replace(
    /"/g,
    '""'
  )}"`;
};


// ==========================================
// CREATE TEMP CSV
// ==========================================

const createCsv = (
  records,
  csvPath
) => {
  const header = [
    "arrivalDate",
    "minPrice",
    "modalPrice",
    "maxPrice",
  ];

  const rows = records.map(
    (record) => {
      return [
        record.arrivalDate.toISOString(),
        record.minPrice,
        record.modalPrice,
        record.maxPrice,
      ]
        .map(csvValue)
        .join(",");
    }
  );

  const csv = [
    header.join(","),
    ...rows,
  ].join("\n");

  fs.writeFileSync(
    csvPath,
    csv,
    "utf8"
  );
};


// ==========================================
// DYNAMIC PRICE PREDICTION
// ==========================================

const generateDynamicPrediction = async ({
  state,
  district,
  market,
  commodity,
  days = 7,
}) => {

  // ----------------------------------------
  // 1. GET HISTORY FROM MONGODB
  // ----------------------------------------

  let records =
  await MarketPrice.find({
    state,
    district,
    market,
    commodity,
  })
    .sort({
      arrivalDate: 1,
    })
    .select(
      "arrivalDate minPrice modalPrice maxPrice"
    )
    .lean();


   // ==========================================
// CHECK WHETHER LOCAL HISTORY NEEDS REFRESH
// ==========================================

const latestLocalRecord =
  records.length > 0
    ? records[records.length - 1]
    : null;

const latestLocalDate =
  latestLocalRecord
    ? new Date(
        latestLocalRecord.arrivalDate
      )
    : null;


// Refresh if:
// 1. We don't have enough records, OR
// 2. Latest local market data is stale.
//
// Mandi data may not update every calendar day,
// so allow a small freshness window.

const HISTORY_REFRESH_DAYS = 3;

const staleCutoff =
  new Date();

staleCutoff.setUTCDate(
  staleCutoff.getUTCDate() -
    HISTORY_REFRESH_DAYS
);

const historyIsStale =
  !latestLocalDate ||
  latestLocalDate <
    staleCutoff;

const needsGovernmentRefresh =
  records.length < MIN_RECORDS ||
  historyIsStale;


// ==========================================
// GOVERNMENT REFRESH COOLDOWN CHECK
// ==========================================

const refreshKey =
  getRefreshKey({
    state,
    district,
    market,
    commodity,
  });

const recentlyRefreshed =
  wasRecentlyRefreshed(
    refreshKey
  );


if (
  needsGovernmentRefresh &&
  !recentlyRefreshed
) {

  if (
    records.length <
    MIN_RECORDS
  ) {
    console.log(
      `Only ${records.length} local records found.`
    );
  }

  if (historyIsStale) {
    console.log(
      `Historical data is stale. Latest local date: ${
        latestLocalDate
          ? latestLocalDate
              .toISOString()
              .slice(0, 10)
          : "none"
      }`
    );
  }
  

  console.log(
    "Checking data.gov.in for latest historical prices..."
  );


  // ========================================
  // FETCH RECENT GOVERNMENT HISTORY
  // ========================================

  const governmentData =
    await fetchHistoricalPrices({
      state,
      district,
      market,
      commodity,

      // historicalMandiService now fetches
      // matching records, sorts by date,
      // and returns the most recent 1000.
      limit: 1000,
    });

    // Government API was successfully checked.
// Do not check this exact combination again
// during the cooldown period.

markAsRefreshed(
  refreshKey
);


  console.log(
    `Government historical records selected: ${
      governmentData.records.length
    }`
  );


  // ========================================
  // SYNC GOVERNMENT DATA INTO MONGODB
  // ========================================

  for (
    const record of
    governmentData.records
  ) {
    try {

      const parts =
        record.Arrival_Date
          ?.split("/");

      if (
        !parts ||
        parts.length !== 3
      ) {
        continue;
      }

      const [
        day,
        month,
        year,
      ] = parts;


      const arrivalDate =
        new Date(
          Date.UTC(
            Number(year),
            Number(month) - 1,
            Number(day)
          )
        );


      const minPrice =
        Number(
          record.Min_Price
        );

      const maxPrice =
        Number(
          record.Max_Price
        );

      const modalPrice =
        Number(
          record.Modal_Price
        );


      if (
        Number.isNaN(
          arrivalDate.getTime()
        ) ||
        Number.isNaN(
          minPrice
        ) ||
        Number.isNaN(
          maxPrice
        ) ||
        Number.isNaN(
          modalPrice
        )
      ) {
        continue;
      }


      await MarketPrice.findOneAndUpdate(
        {
          state:
            record.State,

          district:
            record.District,

          market:
            record.Market,

          commodity:
            record.Commodity,

          variety:
            record.Variety ||
            "",

          arrivalDate,
        },

        {
          $set: {
            grade:
              record.Grade ||
              "",

            minPrice,

            maxPrice,

            modalPrice,

            unit:
              "quintal",

            source:
              "data.gov.in",
          },
        },

        {
          upsert: true,

          returnDocument:
            "after",

          setDefaultsOnInsert:
            true,
        }
      );

    } catch (
      recordError
    ) {
      console.error(
        "Historical auto-sync record error:",
        recordError.message
      );
    }
  }


  // ========================================
  // RELOAD MONGODB AFTER REFRESH
  // ========================================

  records =
    await MarketPrice.find({
      state,
      district,
      market,
      commodity,
    })
      .sort({
        arrivalDate: 1,
      })
      .select(
        "arrivalDate minPrice modalPrice maxPrice"
      )
      .lean();


  if (
    records.length > 0
  ) {
    const newestRecord =
      records[
        records.length - 1
      ];

    console.log(
      `Latest MongoDB historical date: ${
        new Date(
          newestRecord.arrivalDate
        )
          .toISOString()
          .slice(0, 10)
      }`
    );
  }
}

if (
  needsGovernmentRefresh &&
  recentlyRefreshed
) {
  console.log(
    `Skipping data.gov.in refresh: ${state}/${district}/${market}/${commodity} was checked within the last 6 hours`
  );
}

// ==========================================
// CHECK HISTORICAL DATA FRESHNESS
// ==========================================

if (records.length > 0) {
  const latestRecord =
    records[records.length - 1];

  const latestHistoricalDate =
    new Date(
      latestRecord.arrivalDate
    );

  const now = new Date();

  const ageInDays =
    Math.floor(
      (now.getTime() -
        latestHistoricalDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

  const MAX_DATA_AGE_DAYS = 3650; // Allow historical dataset forecasts

}

  // ----------------------------------------
  // 2. CHECK DATA AVAILABILITY
  // ----------------------------------------

  if (
    records.length <
    MIN_RECORDS
  ) {
    return {
      success: false,

      reason:
        "INSUFFICIENT_DATA",

      message:
        `At least ${MIN_RECORDS} historical records are required for prediction.`,

      availableRecords:
        records.length,

      requiredRecords:
        MIN_RECORDS,
    };
  }


  // ----------------------------------------
  // 3. BUILD UNIQUE MODEL NAME
  // ----------------------------------------

  const modelName = [
    safeName(state),
    safeName(district),
    safeName(market),
    safeName(commodity),
  ].join("_");

  const csvPath = path.join(
    tempDirectory,
    `${modelName}.csv`
  );

  const modelPath = path.join(
    modelsDirectory,
    `${modelName}.joblib`
  );


  const kaggleCsvPath = path.join(mlDirectory, "clean_kaggle_mandi_prices.csv");
  let targetCsvPath = csvPath;

  if (records.length > 0) {
    createCsv(records, csvPath);
  } else if (fs.existsSync(kaggleCsvPath)) {
    console.log(`Using cleaned Kaggle dataset fallback for ${commodity} in ${district}`);
    targetCsvPath = kaggleCsvPath;
  }

  try {
    let shouldTrain = !fs.existsSync(modelPath);

    if (!shouldTrain && records.length > 0) {
      const modelStats = fs.statSync(modelPath);
      const latestRecord = records[records.length - 1];
      const latestDataTime = new Date(latestRecord.arrivalDate).getTime();
      if (latestDataTime > modelStats.mtimeMs) {
        shouldTrain = true;
      }
    }

    let trainingResult = null;

    if (shouldTrain) {
      console.log(`Training model: ${modelName} using ${targetCsvPath}`);
      const trainingScript = path.join(mlDirectory, "train_dynamic_model.py");

      trainingResult = await runPython(trainingScript, [
        "--csv",
        targetCsvPath,
        "--state",
        state,
        "--district",
        district,
        "--market",
        market,
        "--commodity",
        commodity,
      ]);

      if (
        !trainingResult.success
      ) {
        return trainingResult;
      }

      const trainedR2 =
  Number(
    trainingResult?.metrics?.r2
  );

if (
  !Number.isFinite(trainedR2) ||
  trainedR2 < MIN_MODEL_R2
) {
  console.log(
    `Model quality too low: R²=${trainedR2}`
  );

  return {
    success: false,

    reason: "LOW_MODEL_QUALITY",

    message:
      "Historical data is available, but the prediction model is not reliable enough for this market and commodity.",

    state,
    district,
    market,
    commodity,

    historicalRecords:
      records.length,

    modelQuality: {
      r2: trainedR2,

      minimumRequiredR2:
        MIN_MODEL_R2,

      mae:
        trainingResult?.metrics?.mae,

      rmse:
        trainingResult?.metrics?.rmse,
    },
  };
}

    } else {

      console.log(
        `Using cached model: ${modelName}`
      );
    }


    // --------------------------------------
    // 7. RUN DYNAMIC PREDICTION
    // --------------------------------------

    const predictionScript =
      path.join(
        mlDirectory,
        "predict_dynamic.py"
      );

    const prediction =
      await runPython(
        predictionScript,
        [
          "--csv",
          targetCsvPath,

          "--state",
          state,

          "--district",
          district,

          "--market",
          market,

          "--commodity",
          commodity,

          "--days",
          String(days),
        ]
      );

      const predictionR2 =
  Number(
    prediction?.model?.metrics?.r2
  );

if (
  !Number.isFinite(predictionR2) ||
  predictionR2 < MIN_MODEL_R2
) {
  console.log(
    `Prediction rejected: R²=${predictionR2}`
  );

  return {
    success: false,

    reason: "LOW_MODEL_QUALITY",

    message:
      "Prediction is unavailable because the trained model did not meet the required accuracy threshold.",

    state,
    district,
    market,
    commodity,

    historicalRecords:
      records.length,

    modelQuality: {
      r2: predictionR2,

      minimumRequiredR2:
        MIN_MODEL_R2,

      mae:
        prediction?.model?.metrics?.mae,

      rmse:
        prediction?.model?.metrics?.rmse,
    },
  };
}


    // --------------------------------------
    // 8. RETURN RESULT
    // --------------------------------------

    return {
      ...prediction,

      modelStatus:
        shouldTrain
          ? "trained"
          : "cached",

      historicalRecords:
        records.length,

      training:
        trainingResult,
    };

  } finally {

    // --------------------------------------
    // 9. DELETE TEMP CSV
    // --------------------------------------

    try {
      if (
        fs.existsSync(csvPath)
      ) {
        fs.unlinkSync(csvPath);
      }
    } catch (cleanupError) {
      console.error(
        "Temporary CSV cleanup error:",
        cleanupError.message
      );
    }
  }
};


module.exports = {
  generateDynamicPrediction,
};