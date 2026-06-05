const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection WITHOUT database to create it first
const setupDB = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: 3306
        });

        console.log('🔧 Setting up database...\n');

        // Create database if it doesn't exist
        const dbName = process.env.DB_NAME || 'assessment';
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        console.log(`✅ Database '${dbName}' created/verified`);

        // Use the database
        await connection.changeUser({ database: dbName });

        // Create streams table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS streams (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL UNIQUE,
                code VARCHAR(20) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table "streams" created/verified');

        // Create students table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS students (
                id INT PRIMARY KEY AUTO_INCREMENT,
                admission_number VARCHAR(50) NOT NULL UNIQUE,
                full_name VARCHAR(100) NOT NULL,
                stream_id INT,
                email VARCHAR(100),
                phone VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE SET NULL
            )
        `);
        console.log('✅ Table "students" created/verified');

        // Fix old student foreign key references to class_streams if present
        const [foreignKeys] = await connection.query(`
            SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ?
              AND TABLE_NAME = 'students'
              AND COLUMN_NAME = 'stream_id'
              AND REFERENCED_TABLE_NAME != 'streams'
        `, [dbName]);

        if (foreignKeys.length > 0) {
            for (const fk of foreignKeys) {
                await connection.query('ALTER TABLE students DROP FOREIGN KEY `' + fk.CONSTRAINT_NAME + '`');
            }
            await connection.query(`
                ALTER TABLE students
                ADD CONSTRAINT students_ibfk_1
                FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE SET NULL
            `);
            console.log('✅ Updated students foreign key to reference streams');
        }

        // Create subjects table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS subjects (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL UNIQUE,
                code VARCHAR(20) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table "subjects" created/verified');

        // Create stream_subjects table for assigning subjects to streams
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS stream_subjects (
                id INT PRIMARY KEY AUTO_INCREMENT,
                stream_id INT NOT NULL,
                subject_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_stream_subject (stream_id, subject_id),
                FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Table "stream_subjects" created/verified');

        // Create grading scale table for configurable grades
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS grading_scale (
                id INT PRIMARY KEY AUTO_INCREMENT,
                min_score DECIMAL(5, 2) NOT NULL,
                max_score DECIMAL(5, 2) NOT NULL,
                grade VARCHAR(5) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_grade_range (min_score, max_score)
            )
        `);
        console.log('✅ Table "grading_scale" created/verified');

        // Seed grading scale defaults if empty
        const [grades] = await connection.query('SELECT COUNT(*) as count FROM grading_scale');
        if (grades[0].count === 0) {
            await connection.query(`INSERT INTO grading_scale (min_score, max_score, grade) VALUES
                (80, 100, 'A'),
                (70, 79.99, 'B'),
                (50, 69.99, 'C'),
                (40, 49.99, 'D'),
                (0, 39.99, 'F')
            `);
            console.log('✅ Default grading scale seeded');
        }

        // Create scores table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS scores (
                id INT PRIMARY KEY AUTO_INCREMENT,
                student_id INT NOT NULL,
                subject_id INT NOT NULL,
                exam_type VARCHAR(50) NOT NULL,
                score DECIMAL(5, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                UNIQUE KEY unique_exam_score (student_id, subject_id, exam_type)
            )
        `);
        console.log('✅ Table "scores" created/verified');

        console.log('\n✨ Database setup completed successfully!');
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        process.exit(1);
    }
};

setupDB();
