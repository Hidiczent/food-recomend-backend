const express = require('express');
const db = require('../db');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../middleware/middleware'); // นำเข้า middleware

const router = express.Router();

db.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    age INT NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
  )
`, (err, result) => {
  if (err) throw err;
  console.log('Table created or already exists.');
});

// ฟังก์ชันตรวจสอบอีเมล
const checkEmailExists = (email, callback) => {
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, results.length > 0);
  });
};

// เส้นทางสำหรับการลงทะเบียน
router.post('/register', async (req, res) => {
  const { first_name, gender, age, email, password } = req.body;

  // ตรวจสอบว่า email นี้มีอยู่ใน database หรือไม่
  checkEmailExists(email, (err, exists) => {
    if (err) {
      console.error('Error checking email:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (exists) {
      // ถ้า email นี้มีอยู่แล้วใน database
      return res.status(409).json({ error: 'Email already exists' });
    } else {
      // ถ้า email นี้ยังไม่มีใน database ให้ทำการลงทะเบียน
      db.query(
        'INSERT INTO users (first_name, gender, age, email, password) VALUES (?, ?, ?, ?, ?)',
        [first_name, gender, age, email, password],
        (err, result) => {
          if (err) {
            console.error('Error inserting user:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          res.status(201).json({ message: 'User registered successfully' });
        }
      );
    }
  });
});

// เส้นทางสำหรับการล็อกอิน
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = results[0];
    if (password !== user.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, 'your_jwt_secret', { expiresIn: '1h' });
    res.json({ token });
  });
});

// เส้นทางสำหรับดึงข้อมูลโปรไฟล์ผู้ใช้
router.get('/profile', authenticateToken, (req, res) => {
  console.log('Debug: Received request for profile'); // Debug
  console.log('Debug: User ID from token:', req.user.userId); // Debug

  const userId = req.user.userId;

  db.query('SELECT first_name, gender, age , email  FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user profile:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    console.log('Debug: Query results:', results); // Debug

    if (results.length === 0) {
      console.log('Debug: User not found'); // Debug
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(results[0]);
  });
});

module.exports = router;
