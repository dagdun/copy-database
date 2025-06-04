const MongoClient = require("mongodb").MongoClient;
const mariadb = require("mariadb");

const mongo_host = "mongodb://localhost:27017";
const mongo_dbname = "db_name";
const mongo_collection = "collection";

const mysql_config = {
  host: "127.0.0.1",
  user: "user",
  password: "xxx",
  port: "3306",
  database: "db_name",
};
const mysql_table = "table";

const connMongo = async () => {
  const client = await MongoClient.connect(mongo_host, { useUnifiedTopology: true });
  return [client, client.db(mongo_dbname)];
};

const connMysql = async () => {
  const pool = mariadb.createPool(mysql_config);
  return await pool.getConnection();
};

const dump = async (sourceCollection, target) => {
  const cursor = sourceCollection.find({}).batchSize(1000);
  let doc;
  while ((doc = await cursor.next())) {
    const fields = Object.keys(doc);
    const values = fields.map((f) => (f === "_id" ? String(doc[f]) : doc[f]));
    await target.query(
      `INSERT IGNORE ${mysql_table} (${fields.join(",")}) VALUE (${fields
        .map(() => "?")
        .join(",")})`,
      values
    );
  }
};

const main = async () => {
  const [mongoClient, mongo] = await connMongo();
  const target = await connMysql();
  const collection = mongo.collection(mongo_collection);

  await dump(collection, target);

  target.end();
  mongoClient.close();
};

(async () => {
  await main();
})();
