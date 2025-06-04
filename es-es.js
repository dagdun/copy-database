const elasticsearch = require("elasticsearch");

const source_host = "localhost:9200";
const source_version = "7.6";
const source_index = "es_index";

const target_host = "localhost:9200";
const target_version = "7.6";
const target_index = "es_index";

const sourceClient = new elasticsearch.Client({
  host: source_host,
  apiVersion: source_version,
});

const targetClient = new elasticsearch.Client({
  host: target_host,
  apiVersion: target_version,
});

const dump = async () => {
  let res = await sourceClient.search({
    index: source_index,
    scroll: "1m",
    body: { query: { match_all: {} } },
    size: 1000,
  });

  while (true) {
    const hits = res.hits.hits;
    if (!hits.length) break;
    let bulk = [];
    for (const hit of hits) {
      bulk.push({ index: { _index: target_index, _id: hit._id } });
      bulk.push(hit._source);
    }
    await targetClient.bulk({ body: bulk });
    res = await sourceClient.scroll({ scrollId: res._scroll_id, scroll: "1m" });
  }
};

(async () => {
  await dump();
})();
