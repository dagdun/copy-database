const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

const connections = {};
const dumps = {};

app.get('/connections', (req, res) => {
  res.json(Object.values(connections));
});

app.post('/connections', (req, res) => {
  const id = Date.now().toString();
  connections[id] = { id, ...req.body };
  res.json(connections[id]);
});

app.delete('/connections/:id', (req, res) => {
  delete connections[req.params.id];
  res.json({});
});

app.get('/collections', async (req, res) => {
  const { connectionId } = req.query;
  const conn = connections[connectionId];
  if (!conn || conn.type !== 'mongo') return res.json([]);
  try {
    const client = await MongoClient.connect(conn.url, { useUnifiedTopology: true });
    const db = client.db(conn.database);
    const colls = await db.listCollections().toArray();
    client.close();
    res.json(colls.map(c => c.name));
  } catch (e) {
    console.error(e.message);
    res.json([]);
  }
});

app.post('/dump', (req, res) => {
  const dumpId = Date.now().toString();
  dumps[dumpId] = { percent: 0, status: 'running' };
  const interval = setInterval(() => {
    const d = dumps[dumpId];
    if (!d) return clearInterval(interval);
    d.percent += 10;
    if (d.percent >= 100) {
      d.percent = 100;
      d.status = 'completed';
      clearInterval(interval);
    }
  }, 500);
  res.json({ dumpId });
});

app.get('/progress/:id', (req, res) => {
  const d = dumps[req.params.id];
  if (!d) return res.status(404).json({ error: 'not found' });
  res.json(d);
});

const PORT = 3001;
app.listen('127.0.0.1', PORT, () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
