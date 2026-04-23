const { MongoClient } = require("mongodb");
const {
  NUMEROLOGY_MEANINGS,
  CAREER_MAPPINGS,
} = require("../numerology/content");

class InMemoryRepository {
  constructor() {
    this.submissions = [];
    this.feedbacks = [];
    this.automationEvents = [];
    this.meanings = NUMEROLOGY_MEANINGS;
    this.careerMappings = CAREER_MAPPINGS;
  }

  async saveSubmission(record) {
    this.submissions.push(record);
    return { id: record.id, storage: "memory" };
  }

  async saveFeedback(record) {
    this.feedbacks.push(record);
    return { id: record.id, storage: "memory" };
  }

  async saveAutomationEvent(record) {
    this.automationEvents.push(record);
    return { id: record.id, storage: "memory" };
  }

  async getSubmissionById(id) {
    return this.submissions.find((item) => item.id === id) || null;
  }

  async getMeaningByNumber(number) {
    return this.meanings.find((item) => item.number === Number(number)) || null;
  }

  async getCareerMappings() {
    return [...this.careerMappings].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }
}

class MongoRepository {
  constructor({
    uri,
    dbName,
    submissionsCollection,
    feedbackCollection,
    automationCollection,
    meaningsCollection,
    mappingsCollection,
  }) {
    this.client = new MongoClient(uri);
    this.dbName = dbName;
    this.submissionsCollection = submissionsCollection;
    this.feedbackCollection = feedbackCollection;
    this.automationCollection = automationCollection;
    this.meaningsCollection = meaningsCollection;
    this.mappingsCollection = mappingsCollection;
    this.connected = false;
  }

  async connect() {
    if (!this.connected) {
      await this.client.connect();
      this.connected = true;
    }
  }

  get db() {
    return this.client.db(this.dbName);
  }

  async saveSubmission(record) {
    await this.connect();
    const result = await this.db.collection(this.submissionsCollection).insertOne(record);
    return { id: result.insertedId.toString(), storage: "mongodb" };
  }

  async saveFeedback(record) {
    await this.connect();
    const result = await this.db.collection(this.feedbackCollection).insertOne(record);
    return { id: result.insertedId.toString(), storage: "mongodb" };
  }

  async saveAutomationEvent(record) {
    await this.connect();
    const result = await this.db.collection(this.automationCollection).insertOne(record);
    return { id: result.insertedId.toString(), storage: "mongodb" };
  }

  async getSubmissionById(id) {
    await this.connect();
    return this.db.collection(this.submissionsCollection).findOne({ id });
  }

  async getMeaningByNumber(number) {
    await this.connect();
    return this.db.collection(this.meaningsCollection).findOne({ number: Number(number) });
  }

  async getCareerMappings() {
    await this.connect();
    return this.db
      .collection(this.mappingsCollection)
      .find({})
      .sort({ priority: -1, title: 1 })
      .toArray();
  }
}

function createRepository() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    return new InMemoryRepository();
  }

  return new MongoRepository({
    uri,
    dbName: process.env.MONGODB_DB_NAME || "hto_numerology",
    submissionsCollection: process.env.MONGODB_SUBMISSIONS_COLLECTION || "numerology_submissions",
    feedbackCollection: process.env.MONGODB_FEEDBACK_COLLECTION || "numerology_feedbacks",
    automationCollection: process.env.MONGODB_AUTOMATION_COLLECTION || "numerology_automation_events",
    meaningsCollection: process.env.MONGODB_MEANINGS_COLLECTION || "numerology_meanings",
    mappingsCollection: process.env.MONGODB_MAPPINGS_COLLECTION || "career_mappings",
  });
}

module.exports = {
  createRepository,
};
