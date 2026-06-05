const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool for Aiven MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306'),
    ssl: {
        rejectUnauthorized: false  // This is CRITICAL for Aiven
    },
    connectTimeout: 60000,  // 60 seconds timeout
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL connected successfully to Aiven Cloud!');
        console.log('📊 Database:', process.env.DB_NAME);
        console.log('🌐 Host:', process.env.DB_HOST);
        connection.release();
    } catch (error) {
        console.error('❌ MySQL connection failed:', error.message);
        console.log('\n💡 Troubleshooting tips:');
        console.log('1. Check environment variables on Render');
        console.log('2. Verify DB_HOST, DB_USER, DB_PASSWORD are correct');
        console.log('3. Make sure SSL is enabled with rejectUnauthorized: false');
    }
};

testConnection();

module.exports = pool;