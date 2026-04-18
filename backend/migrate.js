const db = require('./db');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function ensureMigrationsTable() {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  );
}

async function getAppliedMigrations() {
  const [rows] = await db.execute(
    `SELECT filename FROM schema_migrations`
  );
  return new Set(rows.map(r => r.filename));
}

async function runMigrationFile(filename) {
  const migrationFile = fs.readFileSync(
    path.join(__dirname, 'migrations', filename),
    'utf8'
  );

  const queries = migrationFile
    .split(';')
    .map(q => q.trim())
    .filter(q => q.length > 0);

  for (const query of queries) {
    console.log('Spúšťam:', `${filename}: ${query.substring(0, 50)}...`);
    try {
      await db.execute(query);
    } catch (err) {
      const code = err && err.code;
      const ignorable = [
        'ER_DUP_FIELDNAME',
        'ER_DUP_KEYNAME',
        'ER_TABLE_EXISTS_ERROR',
        'ER_DUP_INDEX',
        'ER_DUP_ENTRY'
      ];
      if (ignorable.includes(code)) {
        console.warn(`⚠️  Preskakujem: ${filename} (${code})`);
        continue;
      }
      throw err;
    }
  }
}

async function runMigrations() {
  try {
    await ensureMigrationsTable();
    const applied = await getAppliedMigrations();

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (applied.has(file)) continue;
      await runMigrationFile(file);
      await db.execute(`INSERT INTO schema_migrations (filename) VALUES (?)`, [file]);
    }

    console.log('✅ Migrácie hotové!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Chyba pri migrácii:', err);
    process.exit(1);
  }
}

runMigrations();
