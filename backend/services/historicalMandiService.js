const {
  fetch,
  Agent,
} = require("undici");

const HISTORICAL_RESOURCE_ID =
  "35985678-0d79-46b4-9ed6-6f13308a1d24";

const agent = new Agent({
  connectTimeout: 30000,
});

const sleep = (ms) =>
  new Promise((resolve) =>
    setTimeout(resolve, ms)
  );


// ==========================================
// PARSE GOVERNMENT DATE
// DD/MM/YYYY
// ==========================================

const parseArrivalDate = (value) => {
  if (!value) {
    return null;
  }

  const parts =
    String(value)
      .trim()
      .split("/");

  if (parts.length !== 3) {
    return null;
  }

  const [
    day,
    month,
    year,
  ] = parts.map(Number);

  if (
    !day ||
    !month ||
    !year
  ) {
    return null;
  }

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
};


// ==========================================
// FETCH ONE PAGE WITH RETRIES
// ==========================================

const fetchPage = async (url) => {
  const MAX_RETRIES = 3;

  for (
    let attempt = 1;
    attempt <= MAX_RETRIES;
    attempt++
  ) {
    try {
      console.log(
        `Historical API attempt ${attempt}/${MAX_RETRIES}`
      );

      const response =
        await fetch(url, {
          dispatcher: agent,

          signal:
            AbortSignal.timeout(
              90000
            ),

          headers: {
            Accept:
              "application/json",

            "User-Agent":
              "AgroConnect360/1.0",
          },
        });

      if (!response.ok) {
        throw new Error(
          `Historical mandi API returned ${response.status}`
        );
      }

      return await response.json();

    } catch (error) {
      console.error(
        `Historical API attempt ${attempt} failed:`,
        error.message
      );

      if (
        attempt ===
        MAX_RETRIES
      ) {
        throw new Error(
          "Government mandi service is temporarily unavailable"
        );
      }

      const delay =
        attempt * 3000;

      console.log(
        `Retrying in ${
          delay / 1000
        } seconds...`
      );

      await sleep(delay);
    }
  }
};


// ==========================================
// FETCH HISTORICAL RECORDS
//
// IMPORTANT:
// We fetch all matching records first,
// sort them by Arrival_Date,
// then keep the most recent `limit` records.
// ==========================================

const fetchHistoricalPrices = async ({
  state,
  district,
  commodity,
  market,
  limit = 1000,
}) => {
  const apiKey =
    process.env.DATA_GOV_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Data.gov API key is not configured"
    );
  }

  const PAGE_SIZE = 500;

  let offset = 0;
  let total = null;

  const allRecords = [];

  while (true) {
    const params =
      new URLSearchParams({
        "api-key": apiKey,
        format: "json",
        limit:
          String(PAGE_SIZE),
        offset:
          String(offset),
      });

    if (state) {
      params.append(
        "filters[State]",
        state
      );
    }

    if (district) {
      params.append(
        "filters[District]",
        district
      );
    }

    if (commodity) {
      params.append(
        "filters[Commodity]",
        commodity
      );
    }

    if (market) {
      params.append(
        "filters[Market]",
        market
      );
    }

    const url =
      `https://api.data.gov.in/resource/` +
      `${HISTORICAL_RESOURCE_ID}?` +
      params.toString();

    console.log(
      `Fetching historical page: offset=${offset}`
    );

    const data =
      await fetchPage(url);

    const records =
      Array.isArray(
        data.records
      )
        ? data.records
        : [];

    if (total === null) {
      total =
        Number(
          data.total || 0
        );

      console.log(
        `Government reports ${total} matching records`
      );
    }

    allRecords.push(
      ...records
    );

    console.log(
      `Received ${records.length}; accumulated ${allRecords.length}`
    );

    // No records returned
    if (
      records.length === 0
    ) {
      break;
    }

    offset +=
      records.length;

    // Government total reached
    if (
      total > 0 &&
      offset >= total
    ) {
      break;
    }

    // Last partial page
    if (
      records.length <
      PAGE_SIZE
    ) {
      break;
    }
  }


  // ========================================
  // VALIDATE + SORT BY ARRIVAL DATE
  // ========================================

  const validRecords =
    allRecords
      .map((record) => ({
        record,

        parsedDate:
          parseArrivalDate(
            record.Arrival_Date
          ),
      }))
      .filter(
        (item) =>
          item.parsedDate !== null
      )
      .sort(
        (a, b) =>
          a.parsedDate -
          b.parsedDate
      );


  // ========================================
  // KEEP MOST RECENT N RECORDS
  // ========================================

  let selectedRecords =
    validRecords;

  if (
    limit &&
    limit > 0 &&
    validRecords.length >
      limit
  ) {
    selectedRecords =
      validRecords.slice(
        -limit
      );
  }


  const records =
    selectedRecords.map(
      (item) =>
        item.record
    );


  // ========================================
  // LOG DATE RANGE
  // ========================================

  if (
    selectedRecords.length >
    0
  ) {
    const oldest =
      selectedRecords[0];

    const newest =
      selectedRecords[
        selectedRecords.length -
          1
      ];

    console.log(
      "Historical records selected:"
    );

    console.log(
      `Oldest: ${oldest.record.Arrival_Date}`
    );

    console.log(
      `Newest: ${newest.record.Arrival_Date}`
    );

    console.log(
      `Selected: ${records.length}`
    );
  }


  return {
    total:
      total ??
      allRecords.length,

    fetched:
      allRecords.length,

    valid:
      validRecords.length,

    records,
  };
};


module.exports = {
  fetchHistoricalPrices,
};