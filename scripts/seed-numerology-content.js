const { MongoClient } = require("mongodb");
const { loadEnvFile } = require("../src/config/loadEnv");
const {
  NUMEROLOGY_MEANINGS,
  CAREER_MAPPINGS,
} = require("../src/numerology/content");

loadEnvFile();

async function main() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Missing MONGODB_URI");
  }

  const dbName = process.env.MONGODB_DB_NAME || "hto_numerology";
  const meaningsCollection = process.env.MONGODB_MEANINGS_COLLECTION || "numerology_meanings";
  const mappingsCollection = process.env.MONGODB_MAPPINGS_COLLECTION || "career_mappings";

  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db(dbName);

    await db.collection(meaningsCollection).deleteMany({});
    await db.collection(mappingsCollection).deleteMany({});

    if (NUMEROLOGY_MEANINGS.length) {
      await db.collection(meaningsCollection).insertMany(NUMEROLOGY_MEANINGS);
    }

    if (CAREER_MAPPINGS.length) {
      await db.collection(mappingsCollection).insertMany(CAREER_MAPPINGS);
    }

    await db.collection(meaningsCollection).createIndex({ number: 1 }, { unique: true });
    await db.collection(mappingsCollection).createIndex({ id: 1 }, { unique: true });
    await db.collection(mappingsCollection).createIndex({ priority: -1 });

    console.log(
      JSON.stringify(
        {
          success: true,
          dbName,
          meaningsInserted: NUMEROLOGY_MEANINGS.length,
          mappingsInserted: CAREER_MAPPINGS.length,
        },
        null,
        2
      )
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
