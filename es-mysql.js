const elasticsearch = require("elasticsearch");
const mariadb = require("mariadb");

const es_index = "es_index";
const es_host = "localhost:9200";
const es_version = "7.6";

const mysql_config = {
  host: "127.0.0.1",
  user: "user",
  password: "xxx",
  port: "3306",
  database: "db_name",
};
const mysql_table = "table";

const esClient = new elasticsearch.Client({
  host: es_host,
  apiVersion: es_version,
});

const connMysql = async () => {
  const pool = mariadb.createPool(mysql_config);
  return await pool.getConnection();
};

const dump = async (target) => {
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
      const fields = Object.keys(doc);
      const values = fields.map((f) => doc[f]);
      await target.query(
        `INSERT IGNORE ${mysql_table} (${fields.join(",")}) VALUE (${fields
          .map(() => "?")
          .join(",")})`,
        values
      );
    }
    res = await esClient.scroll({ scrollId: res._scroll_id, scroll: "1m" });
  }
};

const main = async () => {
  const mysql = await connMysql();
  await dump(mysql);
  mysql.end();
};

(async () => {
  await main();
})();
