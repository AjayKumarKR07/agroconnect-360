/**
 * seed_kaggle_mongo.js
 * ─────────────────────────────────────────────────────────────
 * Seeds ALL 204,159 Kaggle mandi price records into MongoDB
 * for high-accuracy price predictions across all Indian states.
 *
 * Usage:
 *   cd AgroConnect-360/backend
 *   node seed_kaggle_mongo.js
 *
 * Options:
 *   --dry-run    Only print stats, don't write to DB
 *   --state=X    Only seed records for a specific state
 *   --clear      Drop existing Kaggle records before seeding
 * ─────────────────────────────────────────────────────────────
 */

require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// ─── Parse CLI args ───────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const CLEAR = args.includes("--clear");
const STATE_ARG = (args.find((a) => a.startsWith("--state=")) || "").replace("--state=", "").trim();

// ─── Config ───────────────────────────────────────────────────
const CSV_PATH = path.resolve(__dirname, "../ml/clean_kaggle_mandi_prices.csv");
const BATCH_SIZE = 500; // MongoDB bulkWrite batch size

// ─── Mongoose Model ───────────────────────────────────────────
const marketPriceSchema = new mongoose.Schema(
  {
    state:       { type: String, required: true, trim: true },
    district:    { type: String, required: true, trim: true },
    market:      { type: String, required: true, trim: true },
    commodity:   { type: String, required: true, trim: true },
    variety:     { type: String, default: "" },
    grade:       { type: String, default: "" },
    arrivalDate: { type: Date,   required: true },
    minPrice:    { type: Number, required: true },
    maxPrice:    { type: Number, required: true },
    modalPrice:  { type: Number, required: true },
    unit:        { type: String, default: "quintal" },
    source:      { type: String, default: "kaggle" },
  },
  { timestamps: true }
);

marketPriceSchema.index(
  { state: 1, district: 1, market: 1, commodity: 1, variety: 1, arrivalDate: 1 },
  { unique: true }
);

const MarketPrice = mongoose.models.MarketPrice ||
  mongoose.model("MarketPrice", marketPriceSchema);

// ─── Helpers ──────────────────────────────────────────────────
const titleCase = (s) =>
  String(s || "")
    .trim()
    .replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.substr(1).toLowerCase());

const parseCSV = (line, headers) => {
  const values = [];
  let inQuote = false;
  let current = "";
  for (const ch of line) {
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === "," && !inQuote) { values.push(current); current = ""; continue; }
    current += ch;
  }
  values.push(current);
  const obj = {};
  headers.forEach((h, i) => { obj[h] = values[i]?.trim() ?? ""; });
  return obj;
};

const toNum = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
};

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  console.log("\n┌─────────────────────────────────────────────────────");
  console.log("│  🌾 AgroConnect-360 · Kaggle MongoDB Seeder");
  console.log("│  CSV:", CSV_PATH);
  console.log(`│  Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE SEED"}`);
  if (STATE_ARG) console.log(`│  Filter state: ${STATE_ARG}`);
  console.log("└─────────────────────────────────────────────────────\n");

  if (!fs.existsSync(CSV_PATH)) {
    console.error("❌ CSV not found:", CSV_PATH);
    console.error("   Run: python ml/seed_kaggle_data.py  (to generate it first)");
    process.exit(1);
  }

  if (!DRY_RUN) {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log("✅ MongoDB connected:", mongoose.connection.host);

    if (CLEAR) {
      console.log("🗑️  Clearing existing kaggle-source records...");
      const deleted = await MarketPrice.deleteMany({ source: "kaggle" });
      console.log(`   Deleted ${deleted.deletedCount} records.`);
    }
  }

  // ─── Stream and parse CSV ──────────────────────────────────
  const rl = readline.createInterface({
    input: fs.createReadStream(CSV_PATH),
    crlfDelay: Infinity,
  });

  let headers = null;
  let batch = [];
  let totalRead = 0;
  let totalSkipped = 0;
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  let lineNum = 0;

  const flushBatch = async () => {
    if (batch.length === 0) return;
    if (DRY_RUN) {
      totalInserted += batch.length;
      batch = [];
      return;
    }

    const ops = batch.map((doc) => ({
      updateOne: {
        filter: {
          state: doc.state,
          district: doc.district,
          market: doc.market,
          commodity: doc.commodity,
          variety: doc.variety,
          arrivalDate: doc.arrivalDate,
        },
        update: { $set: doc },
        upsert: true,
      },
    }));

    try {
      const result = await MarketPrice.bulkWrite(ops, { ordered: false });
      totalInserted += result.upsertedCount;
      totalUpdated  += result.modifiedCount;
    } catch (err) {
      // E11000 duplicate key — count matched/existing as "skipped"
      const dupes = (err.writeErrors || []).filter((e) => e.code === 11000).length;
      const ok = batch.length - (err.writeErrors || []).length;
      totalInserted += ok;
      totalSkipped  += dupes;
      totalErrors   += (err.writeErrors || []).length - dupes;
      if (totalErrors > 0) {
        console.error(`   ⚠️  ${(err.writeErrors || []).length - dupes} non-duplicate errors in batch`);
      }
    }
    batch = [];
  };

  const printProgress = () => {
    const pct = totalRead.toLocaleString("en-IN");
    process.stdout.write(
      `\r  📊 Read: ${pct} | ✅ New: ${totalInserted.toLocaleString()} | 🔄 Updated: ${totalUpdated.toLocaleString()} | ⏭ Skipped: ${totalSkipped.toLocaleString()}    `
    );
  };

  console.log("📖 Streaming CSV records...\n");

  for await (const line of rl) {
    lineNum++;

    if (lineNum === 1) {
      headers = line.split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
      continue;
    }

    if (!line.trim()) continue;

    const row = parseCSV(line, headers);

    // ── Parse and validate ──────────────────────────────────
    const state     = titleCase(row.state);
    const district  = titleCase(row.district);
    const market    = titleCase(row.market || district); // use district as market if market is empty
    const commodity = titleCase(row.commodity);
    const variety   = titleCase(row.variety || "Other");

    if (!state || !district || !commodity) { totalSkipped++; continue; }

    const modalPrice = toNum(row.modalPrice);
    const minPrice   = toNum(row.minPrice)   ?? modalPrice;
    const maxPrice   = toNum(row.maxPrice)   ?? modalPrice;

    if (modalPrice === null) { totalSkipped++; continue; }

    const arrivalDate = new Date(row.arrivalDate);
    if (isNaN(arrivalDate.getTime())) { totalSkipped++; continue; }

    // ── State filter ────────────────────────────────────────
    if (STATE_ARG && state.toLowerCase() !== STATE_ARG.toLowerCase()) continue;

    totalRead++;

    batch.push({
      state, district, market, commodity, variety,
      grade: "",
      arrivalDate,
      minPrice,
      maxPrice,
      modalPrice,
      unit: "quintal",
      source: "kaggle",
    });

    if (batch.length >= BATCH_SIZE) {
      await flushBatch();
      printProgress();
    }
  }

  // Flush remaining
  await flushBatch();
  printProgress();

  // ─── Final Summary ─────────────────────────────────────────
  console.log("\n\n┌─────────────────────────────────────────────────────");
  console.log("│  ✅ SEEDING COMPLETE");
  console.log(`│  📋 Total CSV rows processed : ${totalRead.toLocaleString("en-IN")}`);
  console.log(`│  ⏭️  Skipped (bad data)       : ${totalSkipped.toLocaleString("en-IN")}`);
  if (!DRY_RUN) {
    console.log(`│  ✨ Newly inserted           : ${totalInserted.toLocaleString("en-IN")}`);
    console.log(`│  🔄 Updated (already exist)  : ${totalUpdated.toLocaleString("en-IN")}`);
    if (totalErrors > 0) console.log(`│  ❌ Errors                  : ${totalErrors}`);
  } else {
    console.log(`│  🧪 DRY RUN — would insert  : ${totalInserted.toLocaleString("en-IN")}`);
  }
  console.log("└─────────────────────────────────────────────────────\n");

  if (!DRY_RUN) {
    const count = await MarketPrice.countDocuments();
    console.log(`📦 Total MarketPrice documents in MongoDB: ${count.toLocaleString("en-IN")}`);
    console.log("\n🚀 Your price predictions will now use real historical data for ALL Indian states!");
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error("\n❌ Fatal error:", err.message);
  process.exit(1);
});
