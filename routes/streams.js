const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET all streams
router.get('/', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [streams] = await connection.query('SELECT * FROM class_streams ORDER BY name');
        connection.release();
        res.json({ success: true, data: streams });
    } catch (error) {
        console.error('Error fetching streams:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch streams', error: error.message });
    }
});

// GET stream details by id
router.get('/:id', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [streams] = await connection.query('SELECT * FROM class_streams WHERE id = ?', [req.params.id]);

        if (streams.length === 0) {
            connection.release();
            return res.status(404).json({ success: false, message: 'Stream not found' });
        }

        const stream = streams[0];

        const [subjects] = await connection.query(
            `SELECT sub.* FROM subjects sub
             INNER JOIN stream_subjects ss ON sub.id = ss.subject_id
             WHERE ss.stream_id = ?
             ORDER BY sub.name`,
            [req.params.id]
        );

        const [studentCount] = await connection.query(
            'SELECT COUNT(*) AS count FROM students WHERE stream_id = ?',
            [req.params.id]
        );
        connection.release();

        res.json({
            success: true,
            data: {
                ...stream,
                subjects,
                student_count: studentCount[0].count
            }
        });
    } catch (error) {
        console.error('Error fetching stream details:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stream details', error: error.message });
    }
});

// POST create a new stream
router.post('/', async (req, res) => {
    try {
        const { name, code } = req.body;

        if (!name || !code) {
            return res.status(400).json({ success: false, message: 'Name and code are required' });
        }

        const connection = await pool.getConnection();
        const result = await connection.query('INSERT INTO class_streams (name, code) VALUES (?, ?)', [name, code]);
        connection.release();

        res.status(201).json({ 
            success: true, 
            message: 'Stream created successfully',
            streamId: result[0].insertId 
        });
    } catch (error) {
        console.error('Error creating stream:', error);
        res.status(500).json({ success: false, message: 'Failed to create stream', error: error.message });
    }
});

// PUT update an existing stream
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code } = req.body;

        if (!name || !code) {
            return res.status(400).json({ success: false, message: 'Name and code are required' });
        }

        const connection = await pool.getConnection();
        const [result] = await connection.query('UPDATE class_streams SET name = ?, code = ? WHERE id = ?', [name, code, id]);
        connection.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Stream not found' });
        }

        res.json({ success: true, message: 'Stream updated successfully' });
    } catch (error) {
        console.error('Error updating stream:', error);
        res.status(500).json({ success: false, message: 'Failed to update stream', error: error.message });
    }
});

// DELETE a stream
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();
        const [result] = await connection.query('DELETE FROM class_streams WHERE id = ?', [id]);
        connection.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Stream not found' });
        }

        res.json({ success: true, message: 'Stream deleted successfully' });
    } catch (error) {
        console.error('Error deleting stream:', error);
        res.status(500).json({ success: false, message: 'Failed to delete stream', error: error.message });
    }
});

module.exports = router;