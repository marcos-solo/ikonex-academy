const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection WITHOUT database to create it first
const setupDB = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: parseInt(process.env.DB_PORT || '3306'),
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        console.log('🔧 Setting up database...\n');

        // Create database if it doesn't exist
        const dbName = process.env.DB_NAME || 'assessment';
        await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        console.log(`✅ Database '${dbName}' created/verified`);

        // Use the database
        await connection.changeUser({ database: dbName });

        // Create class_streams table (matching your route files)
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS class_streams (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table "class_streams" created/verified');

        // Create students table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS students (
                id INT PRIMARY KEY AUTO_INCREMENT,
                admission_number VARCHAR(50) NOT NULL UNIQUE,
                full_name VARCHAR(100) NOT NULL,
                stream_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (stream_id) REFERENCES class_streams(id) ON DELETE SET NULL
            )
        `);
        console.log('✅ Table "students" created/verified');

        // Create subjects table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS subjects (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL UNIQUE,
                code VARCHAR(20) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table "subjects" created/verified');

        // Create stream_subjects table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS stream_subjects (
                stream_id INT NOT NULL,
                subject_id INT NOT NULL,
                PRIMARY KEY (stream_id, subject_id),
                FOREIGN KEY (stream_id) REFERENCES class_streams(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Table "stream_subjects" created/verified');

        // Create grading_scale table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS grading_scale (
                id INT PRIMARY KEY AUTO_INCREMENT,
                min_score DECIMAL(5, 2) NOT NULL,
                max_score DECIMAL(5, 2) NOT NULL,
                grade VARCHAR(5) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table "grading_scale" created/verified');

        // Seed grading scale
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
                exam_type ENUM('CA1', 'CA2', 'EXAM') NOT NULL,
                score DECIMAL(5, 2) NOT NULL,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                UNIQUE KEY unique_exam_score (student_id, subject_id, exam_type)
            )
        `);
        console.log('✅ Table "scores" created/verified');

        // Insert sample data if empty
        const [streamCount] = await connection.query('SELECT COUNT(*) as count FROM class_streams');
        if (streamCount[0].count === 0) {
            await connection.query(`INSERT INTO class_streams (name) VALUES
                ('Form 1A'),
                ('Form 1B'),
                ('Form 2A')
            `);
            console.log('✅ Sample class streams added');
        }

        const [subjectCount] = await connection.query('SELECT COUNT(*) as count FROM subjects');
        if (subjectCount[0].count === 0) {
            await connection.query(`INSERT INTO subjects (name, code) VALUES
                ('Mathematics', 'MATH101'),
                ('English', 'ENG101'),
                ('Science', 'SCI101'),
                ('History', 'HIST101')
            `);
            console.log('✅ Sample subjects added');
        }

        console.log('\n✨ Database setup completed successfully!');
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        console.error(error);
        process.exit(1);
    }
};

setupDB();