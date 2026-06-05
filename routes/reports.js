const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const PDFDocument = require('pdfkit');

router.get('/student-report/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        
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
        
        const [scoreRows] = await pool.query(`
            SELECT sc.*, sub.name as subject_name
            FROM scores sc
            INNER JOIN subjects sub ON sc.subject_id = sub.id
            WHERE sc.student_id = ?
            ORDER BY sub.name
        `, [studentId]);
        
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
        
        let overallTotal = 0;
        let subjectCount = 0;
        Object.values(subjectTotals).forEach(subj => {
            overallTotal += subj.total;
            subjectCount++;
        });
        const overallAverage = subjectCount > 0 ? overallTotal / subjectCount : 0;
        
        let grade = 'N/A';
        if (overallAverage >= 80) grade = 'A';
        else if (overallAverage >= 70) grade = 'B';
        else if (overallAverage >= 50) grade = 'C';
        else if (overallAverage >= 40) grade = 'D';
        else if (overallAverage > 0) grade = 'F';
        
        let position = 'N/A';
        if (student.stream_id) {
            const [rankings] = await pool.query(`
                SELECT s.id, COALESCE(SUM(sc.score), 0) as total
                FROM students s
                LEFT JOIN scores sc ON s.id = sc.student_id
                WHERE s.stream_id = ?
                GROUP BY s.id
                ORDER BY total DESC
            `, [student.stream_id]);
            const studentRank = rankings.findIndex(r => r.id == studentId);
            position = studentRank + 1;
        }
        
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=report_card_${student.admission_number}.pdf`);
        
        doc.pipe(res);
        
        doc.rect(50, 45, 495, 80).stroke();
        doc.fontSize(24).font('Helvetica-Bold').fillColor('#1a237e').text('IKONEX ACADEMY', 70, 60);
        doc.fontSize(12).font('Helvetica').fillColor('#666666').text('Student Progress Report Card', 70, 95);
        doc.fontSize(9).fillColor('#999999').text('Excellence in Education', 70, 115);
        
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333').text('STUDENT INFORMATION', 50, 160);
        doc.moveTo(50, 168).lineTo(545, 168).stroke();
        
        doc.fontSize(10).font('Helvetica').fillColor('#444444');
        doc.text('Student Name:', 60, 180);
        doc.text(`${student.full_name}`, 200, 180);
        doc.text('Admission No:', 60, 195);
        doc.text(`${student.admission_number}`, 200, 195);
        doc.text('Class Stream:', 60, 210);
        doc.text(`${student.stream_name || 'Not Assigned'}`, 200, 210);
        doc.text('Report Date:', 380, 180);
        doc.text(`${new Date().toLocaleDateString()}`, 460, 180);
        
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333').text('ACADEMIC PERFORMANCE', 50, 245);
        doc.moveTo(50, 253).lineTo(545, 253).stroke();
        
        let y = 270;
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
        doc.rect(50, y, 100, 20).fill('#1a237e');
        doc.rect(150, y, 80, 20).fill('#1a237e');
        doc.rect(230, y, 80, 20).fill('#1a237e');
        doc.rect(310, y, 80, 20).fill('#1a237e');
        doc.rect(390, y, 80, 20).fill('#1a237e');
        doc.rect(470, y, 75, 20).fill('#1a237e');
        
        doc.fillColor('#ffffff').text('Subject', 55, y + 5);
        doc.text('CA1', 175, y + 5);
        doc.text('CA2', 255, y + 5);
        doc.text('Exam', 335, y + 5);
        doc.text('Total', 415, y + 5);
        doc.text('Grade', 495, y + 5);
        
        y += 20;
        
        doc.fontSize(9).font('Helvetica').fillColor('#333333');
        let rowColor = false;
        Object.entries(subjectTotals).forEach(([subject, scores]) => {
            const total = scores.total;
            const maxTotal = (scores.ca1 ? 30 : 0) + (scores.ca2 ? 30 : 0) + (scores.exam ? 40 : 0);
            const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
            let subjectGrade = 'N/A';
            if (percentage >= 80) subjectGrade = 'A';
            else if (percentage >= 70) subjectGrade = 'B';
            else if (percentage >= 50) subjectGrade = 'C';
            else if (percentage >= 40) subjectGrade = 'D';
            else if (percentage > 0) subjectGrade = 'F';
            
            if (rowColor) {
                doc.rect(50, y - 2, 495, 18).fill('#f5f5f5');
            }
            doc.fillColor('#333333');
            doc.text(subject, 55, y);
            doc.text(scores.ca1 ? scores.ca1.toString() : '-', 175, y);
            doc.text(scores.ca2 ? scores.ca2.toString() : '-', 255, y);
            doc.text(scores.exam ? scores.exam.toString() : '-', 335, y);
            doc.text(total.toString(), 415, y);
            doc.text(subjectGrade, 495, y);
            y += 18;
            rowColor = !rowColor;
        });
        
        y += 10;
        
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333').text('SUMMARY', 50, y);
        doc.moveTo(50, y + 8).lineTo(545, y + 8).stroke();
        
        y += 20;
        const percentage = subjectCount > 0 ? (overallTotal / (subjectCount * 100)) * 100 : 0;
        
        doc.fontSize(10).font('Helvetica');
        doc.text('Total Marks Obtained:', 60, y);
        doc.text(`${overallTotal} / ${subjectCount * 100}`, 220, y);
        
        doc.text('Overall Percentage:', 60, y + 18);
        doc.text(`${percentage.toFixed(1)}%`, 220, y + 18);
        
        doc.text('Grade:', 60, y + 36);
        const gradeColor = grade === 'A' ? '#2e7d32' : grade === 'B' ? '#1565c0' : grade === 'C' ? '#ed6c02' : '#d32f2f';
        doc.fillColor(gradeColor).text(grade, 220, y + 36);
        
        doc.fillColor('#333333');
        doc.text('Class Position:', 350, y);
        doc.text(position === 'N/A' ? 'Not Ranked' : `${position}`, 460, y);
        
        doc.text('Subjects Offered:', 350, y + 18);
        doc.text(`${subjectCount}`, 460, y + 18);
        
        const footerY = doc.page.height - 50;
        doc.fontSize(8).fillColor('#999999').text('This is an electronically generated report card. No signature is required.', 50, footerY, { align: 'center', width: 495 });
        doc.text(`Generated on ${new Date().toLocaleString()}`, 50, footerY + 15, { align: 'center', width: 495 });
        
        doc.end();
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ success: false, message: 'Error generating report' });
    }
});

router.get('/class-report/:streamId', async (req, res) => {
    try {
        const { streamId } = req.params;
        
        const [streamRows] = await pool.query('SELECT * FROM streams WHERE id = ?', [streamId]);
        const streamName = streamRows[0]?.name || 'Unknown Stream';
        
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
        
        const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=class_report_${streamName.replace(/\s/g, '_')}.pdf`);
        
        doc.pipe(res);
        
        doc.fontSize(22).font('Helvetica-Bold').fillColor('#1a237e').text('IKONEX ACADEMY', { align: 'center' });
        doc.fontSize(14).fillColor('#666666').text(`Class Performance Report - ${streamName}`, { align: 'center' });
        doc.fontSize(10).fillColor('#999999').text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown();
        
        let startX = 50;
        let y = doc.y + 15;
        
        doc.rect(startX, y, 700, 30).fill('#1a237e');
        
        const col1X = startX + 20;
        const col2X = startX + 80;
        const col3X = startX + 230;
        const col4X = startX + 420;
        const col5X = startX + 520;
        const col6X = startX + 610;
        
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff');
        doc.text('RANK', col1X + 5, y + 10);
        doc.text('ADMISSION NUMBER', col2X, y + 10);
        doc.text('STUDENT NAME', col3X, y + 10);
        doc.text('TOTAL MARKS', col4X, y + 10);
        doc.text('AVERAGE', col5X + 10, y + 10);
        doc.text('GRADE', col6X + 10, y + 10);
        
        y += 30;
        
        doc.fontSize(9).font('Helvetica').fillColor('#333333');
        let rowColor = false;
        
        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            const rank = i + 1;
            const average = parseFloat(student.average_score) || 0;
            
            let grade = 'N/A';
            if (!isNaN(average) && average > 0) {
                if (average >= 80) grade = 'A';
                else if (average >= 70) grade = 'B';
                else if (average >= 50) grade = 'C';
                else if (average >= 40) grade = 'D';
                else if (average > 0) grade = 'F';
            }
            
            if (rowColor) {
                doc.rect(startX, y - 2, 700, 25).fill('#f5f5f5');
            }
            
            doc.fillColor('#333333');
            doc.text(rank.toString(), col1X + 10, y + 5);
            doc.text(student.admission_number, col2X, y + 5);
            
            let studentName = student.full_name;
            if (studentName.length > 30) {
                studentName = studentName.substring(0, 27) + '...';
            }
            doc.text(studentName, col3X, y + 5);
            doc.text(student.total_marks.toString(), col4X + 15, y + 5);
            doc.text(`${average.toFixed(1)}%`, col5X + 20, y + 5);
            
            const gradeColor = grade === 'A' ? '#2e7d32' : grade === 'B' ? '#1565c0' : grade === 'C' ? '#ed6c02' : '#d32f2f';
            doc.fillColor(gradeColor);
            doc.text(grade, col6X + 20, y + 5);
            
            y += 25;
            rowColor = !rowColor;
            
            if (y > doc.page.height - 100) {
                doc.addPage();
                y = 50;
                doc.rect(startX, y, 700, 30).fill('#1a237e');
                doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff');
                doc.text('RANK', col1X + 5, y + 10);
                doc.text('ADMISSION NUMBER', col2X, y + 10);
                doc.text('STUDENT NAME', col3X, y + 10);
                doc.text('TOTAL MARKS', col4X, y + 10);
                doc.text('AVERAGE', col5X + 10, y + 10);
                doc.text('GRADE', col6X + 10, y + 10);
                y += 30;
            }
        }
        
        y += 15;
        
        const totalStudents = students.length;
        const totalMarksSum = students.reduce((sum, s) => sum + (parseFloat(s.total_marks) || 0), 0);
        const avgClassScore = totalStudents > 0 ? totalMarksSum / totalStudents : 0;
        const topStudent = students[0]?.full_name || 'N/A';
        const topMarks = students[0]?.total_marks || 0;
        
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a237e').text('SUMMARY STATISTICS', startX, y);
        y += 20;
        
        doc.fontSize(10).font('Helvetica').fillColor('#333333');
        doc.text(`Total Students: ${totalStudents}`, startX + 10, y);
        doc.text(`Class Average: ${avgClassScore.toFixed(1)} marks`, startX + 250, y);
        y += 20;
        doc.text(`Top Student: ${topStudent}`, startX + 10, y);
        doc.text(`Highest Score: ${topMarks} marks`, startX + 250, y);
        
        const footerY = doc.page.height - 40;
        doc.fontSize(8).fillColor('#999999').text('This is an electronically generated class performance report.', startX, footerY, { align: 'center', width: 700 });
        
        doc.end();
        
    } catch (error) {
        console.error('Error generating class report:', error);
        res.status(500).json({ success: false, message: 'Error generating report' });
    }
});

module.exports = router;