import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { jsPDF } from 'jspdf/dist/jspdf.es.min.js';
import { studentAPI, scoreAPI } from '../services/api';

function StudentDetail() {
    const { id } = useParams();
    const [student, setStudent] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudentDetails = async () => {
            try {
                const [studentRes, summaryRes] = await Promise.all([
                    studentAPI.getById(id),
                    scoreAPI.getStudentSummary(id)
                ]);
                setStudent(studentRes.data.data);
                setSummary(summaryRes.data.data);
            } catch (error) {
                console.error('Error fetching student details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudentDetails();
    }, [id]);

    if (loading) return <div className="no-data">Loading student details...</div>;
    if (!student) return <div className="no-data">Student not found</div>;

    const generateReportCard = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Student Report Card', 20, 20);
        doc.setFontSize(12);
        doc.text(`Name: ${student.full_name}`, 20, 35);
        doc.text(`Admission No: ${student.admission_number}`, 20, 45);
        doc.text(`Class Stream: ${student.stream_name || 'Not Assigned'}`, 20, 55);
        doc.text(`Registered: ${new Date(student.created_at).toLocaleDateString()}`, 20, 65);
        doc.text(`Total Marks: ${summary?.total_marks || 0}`, 20, 80);
        doc.text(`Average: ${summary?.average || 0}%`, 20, 90);
        doc.text(`Grade: ${summary?.grade || 'N/A'}`, 20, 100);
        doc.text(`Class Position: ${summary?.position || 'Not ranked'}`, 20, 110);
        doc.text(`Subjects Taken: ${summary?.subjects_count || 0}`, 20, 120);

        let startY = 140;
        doc.setFontSize(14);
        doc.text('Subject Scores', 20, startY);
        startY += 10;
        doc.setFontSize(11);
        doc.text('Subject', 20, startY);
        doc.text('CA1', 90, startY);
        doc.text('CA2', 120, startY);
        doc.text('Exam', 150, startY);
        doc.text('Total', 175, startY);
        startY += 8;

        summary?.scores?.reduce((acc, score) => {
            let subject = acc.find(s => s.subject_id === score.subject_id);
            if (!subject) {
                subject = {
                    subject_id: score.subject_id,
                    subject_name: score.subject_name,
                    scores: { CA1: null, CA2: null, EXAM: null }
                };
                acc.push(subject);
            }
            subject.scores[score.exam_type] = score.score;
            return acc;
        }, []).forEach(subject => {
            const ca1 = subject.scores.CA1 || 0;
            const ca2 = subject.scores.CA2 || 0;
            const exam = subject.scores.EXAM || 0;
            const total = ca1 + ca2 + exam;
            doc.text(subject.subject_name, 20, startY);
            doc.text(String(ca1), 95, startY);
            doc.text(String(ca2), 125, startY);
            doc.text(String(exam), 155, startY);
            doc.text(String(total), 180, startY);
            startY += 8;
            if (startY > 270) {
                doc.addPage();
                startY = 20;
            }
        });

        doc.save(`${student.full_name.replace(/\s+/g, '_')}_report_card.pdf`);
    };

    return (
        <div>
            <Link to="/students" className="page-back">
                ← Back to Students
            </Link>

            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h1 className="card-title">Student Details</h1>
                    <button className="btn btn-success" onClick={generateReportCard}>
                        Download PDF Report
                    </button>
                </div>

                <div className="info-grid">
                    <div className="info-card">
                        <h3>Personal Information</h3>
                        <p><strong>Name:</strong> {student.full_name}</p>
                        <p><strong>Admission Number:</strong> {student.admission_number}</p>
                        <p><strong>Class Stream:</strong> {student.stream_name || 'Not Assigned'}</p>
                        <p><strong>Registered:</strong> {new Date(student.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="info-card">
                        <h3>Academic Summary</h3>
                        <p><strong>Total Marks:</strong> {summary?.total_marks || 0}</p>
                        <p><strong>Average Score:</strong> {summary?.average || 0}%</p>
                        <p>
                            <strong>Grade:</strong>
                            <span className={`grade-badge ${summary?.grade === 'A' ? 'badge-success' : summary?.grade === 'B' ? 'badge-primary' : summary?.grade === 'C' ? 'badge-warning' : summary?.grade === 'D' ? 'badge-secondary' : 'badge-danger'}`}>
                                {summary?.grade || 'N/A'}
                            </span>
                        </p>
                        <p><strong>Class Position:</strong> {summary?.position || 'Not ranked'}</p>
                        <p><strong>Subjects Taken:</strong> {summary?.subjects_count || 0}</p>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Subject Scores</h2>
                </div>
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                        <tr>
                            <th>Subject</th>
                            <th>CA1</th>
                            <th>CA2</th>
                            <th>Exam</th>
                            <th>Total</th>
                            <th>Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summary?.scores?.reduce((acc, score) => {
                            let subject = acc.find(s => s.subject_id === score.subject_id);
                            if (!subject) {
                                subject = {
                                    subject_id: score.subject_id,
                                    subject_name: score.subject_name,
                                    scores: { CA1: null, CA2: null, EXAM: null }
                                };
                                acc.push(subject);
                            }
                            subject.scores[score.exam_type] = score.score;
                            return acc;
                        }, []).map(subject => {
                            const ca1 = subject.scores.CA1 || 0;
                            const ca2 = subject.scores.CA2 || 0;
                            const exam = subject.scores.EXAM || 0;
                            const total = ca1 + ca2 + exam;
                            const average = total / 3;
                            const grade = average >= 80 ? 'A' : average >= 70 ? 'B' : average >= 50 ? 'C' : average >= 40 ? 'D' : 'F';
                            
                            return (
                                <tr key={subject.subject_id}>
                                    <td>{subject.subject_name}</td>
                                    <td>{ca1 || '-'}</td>
                                    <td>{ca2 || '-'}</td>
                                    <td>{exam || '-'}</td>
                                    <td><strong>{total}</strong></td>
                                    <td>{grade}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default StudentDetail;