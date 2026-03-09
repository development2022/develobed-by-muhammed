import Database from 'better-sqlite3';
console.log('better-sqlite3 loaded successfully');
const db = new Database(':memory:');
console.log('Database initialized');
