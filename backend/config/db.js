const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool for XAMPP
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',  // Blank for XAMPP
    database: process.env.DB_NAME || 'assessment',
    port: 3306,  // XAMPP default port
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL connected successfully to database:', process.env.DB_NAME || 'assessment');
        console.log('📊 XAMPP MySQL is running on port 3306');
        connection.release();
    } catch (error) {
        console.error('❌ MySQL connection failed:', error.message);
        console.log('\n💡 Troubleshooting tips:');
        console.log('1. Make sure XAMPP is running (Apache & MySQL)');
        console.log('2. Check if MySQL is running on port 3306');
        console.log('3. Open phpMyAdmin: http://localhost/phpmyadmin');
    }
};

testConnection();

module.exports = pool;