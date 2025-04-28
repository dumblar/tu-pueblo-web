const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true // Allow multiple SQL statements
    });

    try {
        console.log('Running migration to add status to unique constraint...');

        // Read the migration SQL file
        const migrationPath = path.join(__dirname, '../../database/add_status_to_unique_constraint.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Execute the migration
        await connection.query(migrationSQL);

        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Error running migration:', error);
    } finally {
        await connection.end();
    }
}

runMigration(); 