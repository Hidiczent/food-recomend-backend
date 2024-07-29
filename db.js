const mysql = require('mysql');

// สร้างการเชื่อมต่อฐานข้อมูล
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // แก้ไขตามรหัสผ่านของคุณ
  database: 'foodrecommend' // แก้ไขตามชื่อฐานข้อมูลของคุณ
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to database.');
});

module.exports = db;
