const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const PDFDocument = require('pdfkit');

// Generate individual student report card
router.get('/student-report/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        
        // Get student info
        const [studentRows] = await pool.query(`
            SELECT s.*, st.name as stream_name 
            FROM students s
            LEFT JOIN streams st ON s.stream_id = st.id
            WHERE s.id = ?
        `, [studentId]);
        
        if (studentRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        
        const student = studentRows[0];
        
        // Get student scores with subjects
        const [scoreRows] = await pool.query(`
            SELECT sc.*, sub.name as subject_name, sub.code as subject_code
            FROM scores sc
            INNER JOIN subjects sub ON sc.subject_id = sub.id
            WHERE sc.student_id = ?
            ORDER BY sub.name
        `, [studentId]);
        
        // Calculate totals per subject
        const subjectTotals = {};
        scoreRows.forEach(score => {
            if (!subjectTotals[score.subject_name]) {
                subjectTotals[score.subject_name] = { ca1: 0, ca2: 0, exam: 0, total: 0 };
            }
            if (score.exam_type === 'CA1') subjectTotals[score.subject_name].ca1 = score.score;
            if (score.exam_type === 'CA2') subjectTotals[score.subject_name].ca2 = score.score;
            if (score.exam_type === 'EXAM') subjectTotals[score.subject_name].exam = score.score;
            subjectTotals[score.subject_name].total = 
                subjectTotals[score.subject_name].ca1 + 
                subjectTotals[score.subject_name].ca2 + 
                subjectTotals[score.subject_name].exam;
        });
        
        // Calculate overall total and average
        let overallTotal = 0;
        let subjectCount = 0;
        Object.values(subjectTotals).forEach(subj => {
            overallTotal += subj.total;
            subjectCount++;
        });
        const overallAverage = subjectCount > 0 ? overallTotal / subjectCount : 0;
        
        // Get grade
        let grade = 'N/A';
        if (overallAverage >= 80) grade = 'A';
        else if (overallAverage >= 70) grade = 'B';
        else if (overallAverage >= 50) grade = 'C';
        else if (overallAverage >= 40) grade = 'D';
        else grade = 'F';
        
        // Get class position
        let position = 'N/A';
        if (student.stream_id) {
            const [rankings] = await pool.query(`
                SELECT 
                    s.id,
                    COALESCE(SUM(sc.score), 0) as total
                FROM students s
                LEFT JOIN scores sc ON s.id = sc.student_id
                WHERE s.stream_id = ?
                GROUP BY s.id
                ORDER BY total DESC
            `, [student.stream_id]);
            const studentRank = rankings.findIndex(r => r.id == studentId);
            position = studentRank + 1;
        }
        
        // Create PDF
        const doc = new PDFDocument({ margin: 50 });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=report_card_${student.admission_number}.pdf`);
        
        doc.pipe(res);
        
        // Header
        doc.fontSize(20).text('IKONEX ACADEMY', { align: 'center' });
        doc.fontSize(14).text('Student Report Card', { align: 'center' });
        doc.moveDown();
        
        // Student Info
        doc.fontSize(12).text(`Name: ${student.full_name}`);
        doc.text(`Admission Number: ${student.admission_number}`);
        doc.text(`Stream: ${student.stream_name || 'Not Assigned'}`);
        doc.text(`Date: ${new Date().toLocaleDateString()}`);
        doc.moveDown();
        
        // Subject Scores Table
        doc.fontSize(12).text('Academic Performance:', { underline: true });
        doc.moveDown(0.5);
        
        // Table headers
        let y = doc.y;
        doc.text('Subject', 50, y);
        doc.text('CA1', 250, y);
        doc.text('CA2', 320, y);
        doc.text('Exam', 390, y);
        doc.text('Total', 460, y);
        
        doc.moveDown();
        
        // Table rows
        Object.entries(subjectTotals).forEach(([subject, scores]) => {
            y = doc.y;
            doc.text(subject, 50, y);
            doc.text(scores.ca1 || '-', 250, y);
            doc.text(scores.ca2 || '-', 320, y);
            doc.text(scores.exam || '-', 390, y);
            doc.text(scores.total.toString(), 460, y);
            doc.moveDown();
        });
        
        doc.moveDown();
        
        // Summary
        doc.text(`Total Marks: ${overallTotal}`);
        doc.text(`Average Score: ${overallAverage.toFixed(2)}%`);
        doc.text(`Grade: ${grade}`);
        doc.text(`Class Position: ${position}`);
        
        doc.moveDown();
        doc.fontSize(10).text('* This is an official document of Ikonex Academy', { align: 'center' });
        
        doc.end();
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ success: false, message: 'Error generating report' });
    }
});

// Generate class performance report
router.get('/class-report/:streamId', async (req, res) => {
    try {
        const { streamId } = req.params;
        
        // Get stream info
        const [streamRows] = await pool.query('SELECT * FROM streams WHERE id = ?', [streamId]);
        const streamName = streamRows[0]?.name || 'Unknown Stream';
        
        // Get all students in stream with their totals
        const [students] = await pool.query(`
            SELECT 
                s.id,
                s.full_name,
                s.admission_number,
                COALESCE(SUM(sc.score), 0) as total_marks,
                AVG(sc.score) as average_score
            FROM students s
            LEFT JOIN scores sc ON s.id = sc.student_id
            WHERE s.stream_id = ?
            GROUP BY s.id, s.full_name, s.admission_number
            ORDER BY total_marks DESC
        `, [streamId]);
        
        // Create PDF
        const doc = new PDFDocument({ margin: 50 });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=class_report_${streamName}.pdf`);
        
        doc.pipe(res);
        
        // Header
        doc.fontSize(20).text('IKONEX ACADEMY', { align: 'center' });
        doc.fontSize(14).text(`Class Performance Report - ${streamName}`, { align: 'center' });
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown();
        
        // Student Rankings Table
        doc.fontSize(12).text('Student Rankings:', { underline: true });
        doc.moveDown(0.5);
        
        // Table headers
        let y = doc.y;
        doc.text('Rank', 50, y);
        doc.text('Admission No', 100, y);
        doc.text('Student Name', 200, y);
        doc.text('Total Marks', 400, y);
        doc.text('Average', 470, y);
        
        doc.moveDown();
        
        // Table rows
        students.forEach((student, index) => {
            y = doc.y;
            doc.text((index + 1).toString(), 50, y);
            doc.text(student.admission_number, 100, y);
            doc.text(student.full_name.substring(0, 25), 200, y);
            doc.text(student.total_marks.toString(), 400, y);
            doc.text(student.average_score ? student.average_score.toFixed(2) + '%' : '0%', 470, y);
            doc.moveDown();
        });
        
        doc.moveDown();
        doc.fontSize(10).text(`Total Students: ${students.length}`, { align: 'center' });
        doc.text('* This is an official document of Ikonex Academy', { align: 'center' });
        
        doc.end();
        
    } catch (error) {
        console.error('Error generating class report:', error);
        res.status(500).json({ success: false, message: 'Error generating report' });
    }
});

module.exports = router;