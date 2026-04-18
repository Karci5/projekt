const mysql = require("mysql2/promise");
require("dotenv").config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dateStrings: true,
});

db.getConnection()
  .then(() => console.log("Pripojený k MySQL databáze"))
  .catch(err => console.error("Chyba pri pripájaní k DB:", err));

module.exports = db;
