const mariadb = require("mariadb");
const MongoClient = require("mongodb").MongoClient;

const mysql_config = {
  host: "127.0.0.1",
  user: "user",
  password: "xxx",
  port: "3306",
  database: "db_name",
};
const mysql_table = "table";

const mongo_host = "mongodb://localhost:27017";
const mongo_dbname = "db_name";
const mongo_collection = "collection";

const limit = 300;
const start_row = 0;
const limit_break = 500000;

const connMysql = async () => {
  const pool = mariadb.createPool(mysql_config);
  return await pool.getConnection();
};

const connMongo = async () => {
  const client = await MongoClient.connect(mongo_host, { useUnifiedTopology: true });
  return [client, client.db(mongo_dbname)];
};

const dump = async (source, targetCollection, offset) => {
  const rows = await source.query(`SELECT * FROM ${mysql_table} order by id desc limit ${limit} offset ${offset}`);
  for (const row of rows) {
    await targetCollection.insertOne(row);
  }
  return rows.length === limit;
};

const main = async () => {
  const source = await connMysql();
  const [mongoClient, mongo] = await connMongo();
  const collection = mongo.collection(mongo_collection);

  let offset = start_row;
  let more;
  do {
    more = await dump(source, collection, offset);
    offset += limit;
  } while (offset < limit_break && more);

  source.end();
  mongoClient.close();
};

(async () => {
  await main();
})();
