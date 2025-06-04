const elasticsearch = require("elasticsearch");
const MongoClient = require("mongodb").MongoClient;

const es_index = "es_index";
const es_host = "localhost:9200";
const es_version = "7.6";

const mongo_host = "mongodb://localhost:27017";
const mongo_dbname = "db_name";
const mongo_collection = "collection";

const esClient = new elasticsearch.Client({
  host: es_host,
  apiVersion: es_version,
});

const connMongo = async () => {
  const client = await MongoClient.connect(mongo_host, { useUnifiedTopology: true });
  return [client, client.db(mongo_dbname)];
};

const dump = async (targetCollection) => {
  let res = await esClient.search({
    index: es_index,
    scroll: "1m",
    body: { query: { match_all: {} } },
    size: 1000,
  });

  while (true) {
    const hits = res.hits.hits;
    if (!hits.length) break;
    for (const hit of hits) {
      const doc = hit._source;
      doc._id = hit._id;
      try {
        await targetCollection.insertOne(doc);
      } catch (e) {
        console.log(e.message);
      }
    }
    res = await esClient.scroll({ scrollId: res._scroll_id, scroll: "1m" });
  }
};

const main = async () => {
  const [client, db] = await connMongo();
  const collection = db.collection(mongo_collection);
  await dump(collection);
  client.close();
};

(async () => {
  await main();
})();
