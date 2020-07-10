const MongoClient = require("mongodb").MongoClient;

const source_host = "mongodb://localhost:27000";
const source_dbname = "tr_online";

const target_host = "mongodb://localhost:27017";
const target_dbname = "tr_online";

const limit_docs = 500

const conn = async (url, db) => {
  const client = await MongoClient.connect(url, { useUnifiedTopology: true });
  return [client, client.db(db)];
};

const dump = async (name, sourceCollection, targetCollection) => {
  const cursor = sourceCollection.find({}).sort({ _id: -1 }).batchSize(1000);
  let doc;
  let limit = 0;
  while ((doc = await cursor.next())) {
    try {
      targetCollection.insertOne(doc);
      console.log(`${name} insert ${doc._id}`);
    } catch (e) {
      console.log(e.message)
    }

    limit++;
    if (limit > limit_docs) break;
  }
};

const main = async () => {
  const [sourceClient, source] = await conn(source_host, source_dbname);
  const [targetClient, target] = await conn(target_host, target_dbname);

  const coll = await source.listCollections().toArray();

  for (var i = 0; i < coll.length; i++) {
    const collection = coll[i].name;
    const sourceCollection = source.collection(collection);
    const targetCollection = target.collection(collection);
    try {
      await index(sourceCollection, targetCollection, collection);
    } catch (e) {
      console.log("error create index", e.message);
    }
    try {
      await dump(collection, sourceCollection, targetCollection);
    } catch (e) {
      console.log("error dump", e.message);
    }
  }

  /* close connection */
  targetClient.close();
  sourceClient.close();
};

const index = async (source, target, collection) => {
  const index = await source.indexInformation();
  for (var idx in index) {
    const key = {};
    const _index = index[idx];

    for (var elm = 0; elm < _index.length; elm++) {
      if (typeof _index[elm][1] !== "number") {
        continue;
      }
      key[_index[elm][0]] = _index[elm][1];
    }

    console.log("key", collection, key, _index);
    if (Object.keys(key).length > 0) {
      try {
        const res = await target.createIndex(key);
        console.log("result", res);
      } catch (e) {
        console.log(e.message)
      }
    }
  }
};

(async () => {
  await main();
})();
