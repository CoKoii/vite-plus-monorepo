import { DataSource } from "typeorm";
import { resolve } from "path";

export default new DataSource({
  type: "postgres",
  host: process.env["DB_HOST"] ?? "localhost",
  port: Number(process.env["DB_PORT"]) || 5432,
  username: process.env["DB_USERNAME"] ?? "",
  password: process.env["DB_PASSWORD"] ?? "",
  database: process.env["DB_DATABASE"] ?? "",
  entities: [resolve(__dirname, "../../modules/**/entities/*.entity.{ts,js}")],
  migrations: [resolve(__dirname, "migrations/*.{ts,js}")],
  migrationsTableName: "migrations",
});
