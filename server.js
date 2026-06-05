const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PPORT || 5000;


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const streamRoutes = require('./routes/streams');
const studentRoutes = require('./routes/students');
const subjectRoutes = require('./routes/subjects');
const scoreRoutes = require('./routes/scores');
const reportRoutes = require('./routes/reports');


app.use('/api/streams', streamRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/reports', reportRoutes);


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
            scores: '/api/scores',
            reports: '/api/reports'
        }
    });
});


app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong!' });
});


app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 API Health check: http://localhost:${PORT}/api/health`);
});