const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET all students (with stream info)
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.*, c.name as stream_name 
            FROM students s
            LEFT JOIN streams c ON s.stream_id = c.id
            ORDER BY s.created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET students by stream
router.get('/stream/:streamId', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.*, c.name as stream_name 
            FROM students s
            LEFT JOIN streams c ON s.stream_id = c.id
            WHERE s.stream_id = ?
            ORDER BY s.full_name
        `, [req.params.streamId]);
        
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET single student with full details (including scores)
router.get('/:id', async (req, res) => {
    try {
        // Get student basic info
        const [studentRows] = await pool.query(`
            SELECT s.*, c.name as stream_name 
            FROM students s
            LEFT JOIN streams c ON s.stream_id = c.id
            WHERE s.id = ?
        `, [req.params.id]);
        
        if (studentRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        
        // Get student's scores with subject details
        const [scoreRows] = await pool.query(`
            SELECT sc.*, sub.name as subject_name, sub.code as subject_code
            FROM scores sc
            INNER JOIN subjects sub ON sc.subject_id = sub.id
            WHERE sc.student_id = ?
            ORDER BY sub.name
        `, [req.params.id]);
        
        const student = studentRows[0];
        student.scores = scoreRows;
        
        res.json({ success: true, data: student });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST create new student (auto-generate admission number)
router.post('/', async (req, res) => {
    const { full_name, stream_id } = req.body;
    
    if (!full_name) {
        return res.status(400).json({ success: false, message: 'Student name is required' });
    }
    
    try {
        // Generate realistic admission number: IKX-YYYY-XXX
        const currentYear = new Date().getFullYear();
        
        // Count students created this year to get sequential number
        const [countResult] = await pool.query(`
            SELECT COUNT(*) as count FROM students 
            WHERE YEAR(created_at) = ?
        `, [currentYear]);
        
        const sequentialNumber = countResult[0].count + 1;
        const paddedNumber = String(sequentialNumber).padStart(3, '0');
        const admission_number = `IKX-${currentYear}-${paddedNumber}`;
        
        const [result] = await pool.query(
            'INSERT INTO students (admission_number, full_name, stream_id) VALUES (?, ?, ?)',
            [admission_number, full_name, stream_id || null]
        );
        
        const [newStudent] = await pool.query(`
            SELECT s.*, c.name as stream_name 
            FROM students s
            LEFT JOIN streams c ON s.stream_id = c.id
            WHERE s.id = ?
        `, [result.insertId]);
        
        res.status(201).json({ success: true, data: newStudent[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT update student
router.put('/:id', async (req, res) => {
    const { full_name, stream_id } = req.body;
    
    if (!full_name) {
        return res.status(400).json({ success: false, message: 'Student name is required' });
    }
    
    try {
        const [result] = await pool.query(
            'UPDATE students SET full_name = ?, stream_id = ? WHERE id = ?',
            [full_name, stream_id || null, req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        
        const [updatedStudent] = await pool.query(`
            SELECT s.*, c.name as stream_name 
            FROM students s
            LEFT JOIN streams c ON s.stream_id = c.id
            WHERE s.id = ?
        `, [req.params.id]);
        
        res.json({ success: true, data: updatedStudent[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE student
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM students WHERE id = ?', [req.params.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        
        res.json({ success: true, message: 'Student deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;