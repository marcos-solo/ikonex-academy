const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// POST record or update score
router.post('/', async (req, res) => {
    const { student_id, subject_id, exam_type, score } = req.body;
    
    if (!student_id || !subject_id || !exam_type || score === undefined) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    if (score < 0 || score > 100) {
        return res.status(400).json({ success: false, message: 'Score must be between 0 and 100' });
    }
    
    try {
        // Check if score already exists
        const [existing] = await pool.query(
            'SELECT * FROM scores WHERE student_id = ? AND subject_id = ? AND exam_type = ?',
            [student_id, subject_id, exam_type]
        );
        
        if (existing.length > 0) {
            // Update existing score
            await pool.query(
                'UPDATE scores SET score = ? WHERE student_id = ? AND subject_id = ? AND exam_type = ?',
                [score, student_id, subject_id, exam_type]
            );
            res.json({ success: true, message: 'Score updated successfully' });
        } else {
            // Insert new score
            await pool.query(
                'INSERT INTO scores (student_id, subject_id, exam_type, score) VALUES (?, ?, ?, ?)',
                [student_id, subject_id, exam_type, score]
            );
            res.status(201).json({ success: true, message: 'Score recorded successfully' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET student scores with subjects
router.get('/student/:studentId', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT sc.*, sub.name as subject_name, sub.code as subject_code
            FROM scores sc
            INNER JOIN subjects sub ON sc.subject_id = sub.id
            WHERE sc.student_id = ?
            ORDER BY sub.name, sc.exam_type
        `, [req.params.studentId]);
        
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET class performance for a subject
router.get('/class-performance/:streamId/:subjectId', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                s.id as student_id,
                s.full_name,
                s.admission_number,
                COALESCE(SUM(sc.score), 0) as total_score,
                AVG(sc.score) as average_score,
                COUNT(sc.score) as assessments_count
            FROM students s
            LEFT JOIN scores sc ON s.id = sc.student_id AND sc.subject_id = ?
            WHERE s.stream_id = ?
            GROUP BY s.id, s.full_name, s.admission_number
            ORDER BY total_score DESC
        `, [req.params.subjectId, req.params.streamId]);
        
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// CALCULATE student summary (totals, averages, grades, position)
router.get('/student-summary/:studentId', async (req, res) => {
    try {
        // Get all scores for the student
        const [scores] = await pool.query(`
            SELECT sc.*, sub.name as subject_name
            FROM scores sc
            INNER JOIN subjects sub ON sc.subject_id = sub.id
            WHERE sc.student_id = ?
        `, [req.params.studentId]);
        
        // Calculate total marks (sum of all scores)
        const total_marks = scores.reduce((sum, s) => sum + s.score, 0);
        
        // Calculate average
        const average = scores.length > 0 ? total_marks / scores.length : 0;
        
        // Get grade based on average
        const [gradeRow] = await pool.query(
            'SELECT grade FROM grading_scale WHERE ? BETWEEN min_score AND max_score',
            [average]
        );
        const grade = gradeRow.length > 0 ? gradeRow[0].grade : 'N/A';
        
        // Get student's stream
        const [student] = await pool.query('SELECT stream_id FROM students WHERE id = ?', [req.params.studentId]);
        
        let position = null;
        if (student[0].stream_id) {
            // Calculate position in class
            const [rankings] = await pool.query(`
                SELECT 
                    s.id,
                    COALESCE(SUM(sc.score), 0) as total
                FROM students s
                LEFT JOIN scores sc ON s.id = sc.student_id
                WHERE s.stream_id = ?
                GROUP BY s.id
                ORDER BY total DESC
            `, [student[0].stream_id]);
            
            const studentRank = rankings.findIndex(r => r.id == req.params.studentId);
            position = studentRank + 1;
        }
        
        res.json({
            success: true,
            data: {
                student_id: req.params.studentId,
                total_marks,
                average: average.toFixed(2),
                grade,
                position,
                subjects_count: scores.length,
                scores: scores
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET class ranking
router.get('/class-ranking/:streamId', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                s.id,
                s.full_name,
                s.admission_number,
                COALESCE(SUM(sc.score), 0) as total_marks,
                AVG(sc.score) as average_score,
                COUNT(DISTINCT sc.subject_id) as subjects_taken
            FROM students s
            LEFT JOIN scores sc ON s.id = sc.student_id
            WHERE s.stream_id = ?
            GROUP BY s.id, s.full_name, s.admission_number
            ORDER BY total_marks DESC
        `, [req.params.streamId]);
        
        // Add rank
        const rankedRows = rows.map((row, index) => ({
            ...row,
            rank: index + 1,
            average_score: parseFloat(row.average_score || 0).toFixed(2)
        }));
        
        res.json({ success: true, data: rankedRows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;