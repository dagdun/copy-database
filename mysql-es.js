const mariadb = require("mariadb");
const elasticsearch = require("elasticsearch");

const mysql_config = {
  host: "127.0.0.1",
  user: "user",
  password: "xxx",
  port: "3306",
  database: "db_name",
};
const mysql_table = "table";

const es_index = "es_index";
const es_host = "localhost:9200";
const es_version = "7.6";

const limit = 300;
const start_row = 0;
const limit_break = 500000;

const esClient = new elasticsearch.Client({
  host: es_host,
  apiVersion: es_version,
});

const connMysql = async () => {
  const pool = mariadb.createPool(mysql_config);
  return await pool.getConnection();
};

const dump = async (source, offset) => {
  const rows = await source.query(`SELECT * FROM ${mysql_table} order by id desc limit ${limit} offset ${offset}`);
  let bulk = [];
  for (const row of rows) {
    bulk.push({ index: { _index: es_index, _id: row.id } });
    bulk.push(row);
  }
  if (bulk.length > 0) {
    await esClient.bulk({ body: bulk });
  }
  return rows.length === limit;
};

const main = async () => {
  const source = await connMysql();
  let offset = start_row;
  let more;
  do {
    more = await dump(source, offset);
    offset += limit;
  } while (offset < limit_break && more);
  source.end();
};

(async () => {
  await main();
})();
