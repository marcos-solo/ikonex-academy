const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET all subjects
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM subjects ORDER BY name');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET single subject by ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM subjects WHERE id = ?', [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }
        
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST create new subject
router.post('/', async (req, res) => {
    const { name, code } = req.body;
    
    if (!name || !code) {
        return res.status(400).json({ success: false, message: 'Name and code are required' });
    }
    
    try {
        const [result] = await pool.query('INSERT INTO subjects (name, code) VALUES (?, ?)', [name, code.toUpperCase()]);
        const [newSubject] = await pool.query('SELECT * FROM subjects WHERE id = ?', [result.insertId]);
        
        res.status(201).json({ success: true, data: newSubject[0] });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Subject code already exists' });
        }
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT update subject
router.put('/:id', async (req, res) => {
    const { name, code } = req.body;
    
    if (!name || !code) {
        return res.status(400).json({ success: false, message: 'Name and code are required' });
    }
    
    try {
        const [result] = await pool.query('UPDATE subjects SET name = ?, code = ? WHERE id = ?', [name, code.toUpperCase(), req.params.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }
        
        const [updatedSubject] = await pool.query('SELECT * FROM subjects WHERE id = ?', [req.params.id]);
        res.json({ success: true, data: updatedSubject[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE subject
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM subjects WHERE id = ?', [req.params.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }
        
        res.json({ success: true, message: 'Subject deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET subjects by stream (subjects taught in a specific class)
router.get('/stream/:streamId', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.* FROM subjects s
            INNER JOIN stream_subjects ss ON s.id = ss.subject_id
            WHERE ss.stream_id = ?
            ORDER BY s.name
        `, [req.params.streamId]);
        
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST assign subject to stream
router.post('/assign-to-stream', async (req, res) => {
    const { stream_id, subject_id } = req.body;
    
    if (!stream_id || !subject_id) {
        return res.status(400).json({ success: false, message: 'Stream ID and Subject ID are required' });
    }
    
    try {
        await pool.query('INSERT INTO stream_subjects (stream_id, subject_id) VALUES (?, ?)', [stream_id, subject_id]);
        res.status(201).json({ success: true, message: 'Subject assigned to stream successfully' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Subject already assigned to this stream' });
        }
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE remove subject from stream
router.delete('/remove-from-stream/:streamId/:subjectId', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM stream_subjects WHERE stream_id = ? AND subject_id = ?', 
            [req.params.streamId, req.params.subjectId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }
        
        res.json({ success: true, message: 'Subject removed from stream successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;