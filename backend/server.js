const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const streamRoutes = require('./routes/streams');
const studentRoutes = require('./routes/students');
const subjectRoutes = require('./routes/subjects');
const scoreRoutes = require('./routes/scores');

// Use routes
app.use('/api/streams', streamRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/scores', scoreRoutes);

// Test route
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true,
        status: 'OK', 
        message: 'Ikonex Academy API is running',
        timestamp: new Date(),
        endpoints: {
            streams: '/api/streams',
            students: '/api/students', 
            subjects: '/api/subjects',
            scores: '/api/scores'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API Health check: http://localhost:${PORT}/api/health`);
    console.log(`\n📚 Available APIs:`);
    console.log(`   GET    /api/streams`);
    console.log(`   POST   /api/streams`);
    console.log(`   GET    /api/students`);
    console.log(`   POST   /api/students`);
    console.log(`   GET    /api/subjects`);
    console.log(`   POST   /api/subjects`);
    console.log(`   POST   /api/scores`);
    console.log(`   GET    /api/scores/class-ranking/:streamId`);
});