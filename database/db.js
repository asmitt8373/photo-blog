import { SQLiteDatabase } from "flyweightjs";
import { join } from "path";
import { fileURLToPath } from "url";
import path from "path";
import adaptor from "flyweight-sqlite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const _path = (subPath) => join(__dirname, subPath);

const paths = {
  sql: _path("sql"),
  tables: _path("sql/tables.sql"),
  views: _path("views"),
  types: _path("db.d.ts"),
  migrations: _path("migrations"),
};

const database = new SQLiteDatabase({
  db: _path("app.db"),
  adaptor,
  ...paths,
});

const db = database.getClient();

export { database, db, paths };
