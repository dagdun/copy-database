const MongoClient = require("mongodb").MongoClient;
const elasticsearch = require("elasticsearch");

const es_index = "es_index";
const es_host = "localhost:9200";
const es_version = "7.6";
const mongo_dbname = "stats";
const mongo_source = "mongodb://localhost:27017";
const mongo_collection = "es_index";

const esClient = new elasticsearch.Client({
  host: es_host,
  // log: "trace",
  apiVersion: es_version,
});

const conn = async (url, db) => {
  const client = await MongoClient.connect(url, { useUnifiedTopology: true });
  return [client, client.db(db)];
};

const main = async () => {
  const collection = mongo_collection;
  const [sourceClient, source] = await conn(mongo_source, mongo_dbname);
  const sourceCollection = source.collection(collection);

  const cursor = sourceCollection.find({}).sort({ _id: -1 }).batchSize(5000);
  let doc;
  let esBulk = [];
  let i = 0;
  let insertLog = [];
  while ((doc = await cursor.next())) {
    // overide doc
    delete doc._id;

    esBulk.push({
      index: { _index: es_index, _id: doc.id },
    });
    esBulk.push(doc);
    insertLog.push(doc.id);
    if (++i % 500 === 0) {
      const esResult = await esClient.bulk({ body: esBulk });
      console.log("insert", i, "error: ", esResult.error);
      esBulk = [];
      insertLog = [];
    }
  }
  await esClient.bulk({ body: esBulk });

  /* close connection */
  sourceClient.close();
};

(async () => {
  await main();
})();
