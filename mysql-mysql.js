// require table structure in target before dump the data

const mariadb = require("mariadb");
const limit = 300;
const start_row = 0;
const limit_break = 500000;
const db_name = "db_name";
const skipTable = [];
const selectedTable = [];

const connect_target = async () => {
  const pool = mariadb.createPool({
    host: "127.0.0.1",
    user: "user",
    password: "xxx",
    port: "3306",
    database: db_name,
  });
  return await pool.getConnection();
};

const connect_source = async () => {
  const pool = mariadb.createPool({
    host: "127.0.0.1",
    user: "user",
    password: "xxx",
    port: "3306",
    database: db_name,
  });
  return await pool.getConnection();
};

const getFields = (row, primary) => {
  const fields = [];
  const values = [];
  let key;
  for (var field in row) {
    fields.push(field);
    values.push(row[field]);
    if (field === primary) {
      key = row[field];
    }
  }
  return { fields, values };
};

const dump = async (source, target, table, primary, offset) => {
  try {
    const select = `SELECT * FROM ${table} order by \`${primary}\` desc limit ${limit} offset ${offset}`;
    const rows = await source.query(select);
    let fields;
    const values = [];
    for (var i = 0; i < rows.length; i++) {
      const data = getFields(rows[i], primary);
      fields = data.fields;
      values.push(data.values);
    }

    target.batch(
      `INSERT IGNORE ${table} (${fields.join(",")}) VALUE (${fields
        .map((i) => "?")
        .join(",")})`,
      values
    );

    await target.commit();
    console.log("commit data", table, rows.length, "/", offset);
    return rows.length === limit;
  } catch (e) {
    console.log("error", e.message);
    return false;
  }
};

const getPrimary = (keys) => {
  const obj = keys.find((key) => {
    return key.Key_name === "PRIMARY";
  });
  return obj.Column_name;
};

const main = async () => {
  const source = await connect_source();
  console.log("connected source");
  const target = await connect_target();
  console.log("connected target");
  const tables = await source.query("show tables");
  for (var i = 0; i < tables.length; i++) {
    const table = tables[i][`Tables_in_${db_name}`];
    if (skipTable.includes(table)) {
      continue;
    }

    if (selectedTable.length > 0 && !selectedTable.includes(table)) {
      continue;
    }
    console.log("start table: ", table);

    const keys = await source.query(
      `SHOW KEYS FROM ${table} WHERE Key_name = "PRIMARY"`
    );
    const primary = getPrimary(keys);
    console.log("table ", table, "has ", primary);
    let offset = start_row;
    let more;
    do {
      more = await dump(source, target, table, primary, offset);
      offset += limit;
    } while (offset < limit_break && more);
  }
  source.end();
  target.end();
};

(async () => {
  await main();
})();
