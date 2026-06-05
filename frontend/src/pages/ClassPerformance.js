import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf/dist/jspdf.es.min.js';
import { streamAPI, subjectAPI, scoreAPI } from '../services/api';

function ClassPerformance() {
    const [streams, setStreams] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedStream, setSelectedStream] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [performance, setPerformance] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchStreams = async () => {
            try {
                const response = await streamAPI.getAll();
                setStreams(response.data.data);
            } catch (error) {
                console.error('Error fetching streams:', error);
            }
        };

        fetchStreams();
    }, []);

    useEffect(() => {
        if (!selectedStream) {
            setSubjects([]);
            setSelectedSubject('');
            setPerformance([]);
            return;
        }

        const fetchSubjects = async () => {
            try {
                const response = await subjectAPI.getByStream(selectedStream);
                setSubjects(response.data.data);
            } catch (error) {
                console.error('Error fetching subjects for stream:', error);
                setSubjects([]);
            }
        };

        fetchSubjects();
    }, [selectedStream]);

    useEffect(() => {
        if (!selectedStream || !selectedSubject) return;

        const fetchPerformance = async () => {
            setLoading(true);
            try {
                const response = await scoreAPI.getClassPerformance(selectedStream, selectedSubject);
                setPerformance(response.data.data);
            } catch (error) {
                console.error('Error fetching class performance:', error);
                setPerformance([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPerformance();
    }, [selectedStream, selectedSubject]);

    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Class Performance Report', 20, 20);

        const streamName = streams.find(stream => stream.id === Number(selectedStream))?.name || 'Unknown Stream';
        const subjectName = subjects.find(subject => subject.id === Number(selectedSubject))?.name || 'Selected Subject';

        doc.setFontSize(11);
        doc.text(`Stream: ${streamName}`, 20, 30);
        doc.text(`Subject: ${subjectName}`, 20, 36);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 42);

        let y = 55;
        const header = ['Rank', 'Admission', 'Name', 'Total', 'Average', 'Grades'];
        header.forEach((text, i) => doc.text(text, 20 + i * 28, y));
        y += 8;

        performance.forEach(row => {
            doc.text(String(row.rank), 20, y);
            doc.text(row.admission_number || '-', 48, y);
            doc.text(row.full_name, 76, y);
            doc.text(String(row.total_score), 140, y);
            doc.text(String(row.average_score), 168, y);
            const grade = row.average_score >= 80 ? 'A' : row.average_score >= 70 ? 'B' : row.average_score >= 50 ? 'C' : row.average_score >= 40 ? 'D' : 'F';
            doc.text(grade, 196, y);
            y += 8;
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
        });

        doc.save(`${streamName.replace(/\s+/g, '_')}_${subjectName.replace(/\s+/g, '_')}_class_report.pdf`);
    };

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <h1 className="card-title">Class Performance</h1>
                </div>

                <div className="form-group" style={{ marginBottom: '20px', maxWidth: '600px' }}>
                    <label>Select Stream</label>
                    <select
                        className="form-control"
                        value={selectedStream}
                        onChange={(e) => setSelectedStream(e.target.value)}
                    >
                        <option value="">Select Stream</option>
                        {streams.map(stream => (
                            <option key={stream.id} value={stream.id}>
                                {stream.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group" style={{ marginBottom: '20px', maxWidth: '600px' }}>
                    <label>Select Subject</label>
                    <select
                        className="form-control"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        disabled={!selectedStream}
                    >
                        <option value="">Select Subject</option>
                        {subjects.map(subject => (
                            <option key={subject.id} value={subject.id}>
                                {subject.name} ({subject.code})
                            </option>
                        ))}
                    </select>
                </div>

                {loading && <div>Loading class performance...</div>}

                {performance.length > 0 && (
                    <>
                        <button className="btn btn-success" onClick={downloadPDF} style={{ marginBottom: '20px' }}>
                            Download Class Performance PDF
                        </button>
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Admission</th>
                                    <th>Name</th>
                                    <th>Total Score</th>
                                    <th>Average</th>
                                    <th>Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {performance.map(student => {
                                    const average = Number(student.average_score) || 0;
                                    const grade = average >= 80 ? 'A' : average >= 70 ? 'B' : average >= 50 ? 'C' : average >= 40 ? 'D' : 'F';
                                    return (
                                        <tr key={student.student_id}>
                                            <td>{student.rank}</td>
                                            <td>{student.admission_number}</td>
                                            <td>{student.full_name}</td>
                                            <td>{student.total_score}</td>
                                            <td>{average.toFixed(2)}%</td>
                                            <td>{grade}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            </table>
                        </div>
                    </>
                )}

                {selectedStream && selectedSubject && !loading && performance.length === 0 && (
                    <div className="alert alert-info">No scores recorded yet for this subject in the selected stream.</div>
                )}
            </div>
        </div>
    );
}

export default ClassPerformance;
