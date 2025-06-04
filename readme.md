### copy mongo to mongo
- copy row by row (bulk)
- auto copy index
- ignore duplicated data

```node mongo-mongo.js```

### copy mysql to mysql
- copy row by row (bulk)
- copy only data. not include table and index

```node mysql-mysql.js```

### copy mongo collection to es
- copy row by row (bulk)

```node mongo-es.js```

### web ui

A simple Express server and React (Vite + Ant Design) interface are included in `server` and `client` directories.

1. Install dependencies for server and client:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
2. Start the backend server (runs on localhost only):
   ```bash
   npm start --prefix server
   ```
3. In another terminal start the frontend:
   ```bash
   npm run dev --prefix client
   ```

The UI allows you to manage database connections, choose a source and target connection, select collections and options, and shows progress while dumping data.
