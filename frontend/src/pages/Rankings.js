import React, { useState, useEffect } from 'react';
import { streamAPI, scoreAPI } from '../services/api';

function Rankings() {
    const [streams, setStreams] = useState([]);
    const [selectedStream, setSelectedStream] = useState('');
    const [rankings, setRankings] = useState([]);
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
        if (!selectedStream) return;
        const fetchRankings = async () => {
            setLoading(true);
            try {
                const response = await scoreAPI.getClassRanking(selectedStream);
                setRankings(response.data.data);
            } catch (error) {
                console.error('Error fetching rankings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRankings();
    }, [selectedStream]);

    const downloadClassReport = async () => {
        if (!selectedStream) {
            alert('Please select a stream first');
            return;
        }
        try {
            window.open(`https://ikonex-academy-1.onrender.com/api/reports/class-report/${selectedStream}`, '_blank');
        } catch (error) {
            console.error('Error downloading report:', error);
            alert('Failed to download class report');
        }
    };

    const getGradeColor = (average) => {
        if (average >= 80) return '#48bb78';
        if (average >= 70) return '#4299e1';
        if (average >= 50) return '#ed8936';
        return '#f56565';
    };

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <h1 className="card-title">Class Rankings</h1>
                    <button className="btn btn-success" onClick={downloadClassReport}>
                        📊 Download Class Report (PDF)
                    </button>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label>Select Class Stream</label>
                    <select
                        className="form-control"
                        value={selectedStream}
                        onChange={(e) => setSelectedStream(e.target.value)}
                        style={{ maxWidth: '300px' }}
                    >
                        <option value="">Select Stream</option>
                        {streams.map(stream => (
                            <option key={stream.id} value={stream.id}>
                                {stream.name}
                            </option>
                        ))}
                    </select>
                </div>

                {loading && <div>Loading rankings...</div>}

                {rankings.length > 0 && (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Admission No</th>
                                    <th>Student Name</th>
                                    <th>Total Marks</th>
                                    <th>Average Score</th>
                                    <th>Subjects Taken</th>
                                    <th>Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rankings.map(student => (
                                    <tr key={student.id}>
                                        <td><strong>#{student.rank}</strong></td>
                                        <td>{student.admission_number}</td>
                                        <td>{student.full_name}</td>
                                        <td>{student.total_marks}</td>
                                        <td>{student.average_score}%</td>
                                        <td>{student.subjects_taken}</td>
                                        <td>
                                            <span style={{
                                                background: getGradeColor(student.average_score),
                                                color: 'white',
                                                padding: '5px 10px',
                                                borderRadius: '5px',
                                                fontWeight: 'bold'
                                            }}>
                                                {student.average_score >= 80 ? 'A' :
                                                 student.average_score >= 70 ? 'B' :
                                                 student.average_score >= 50 ? 'C' :
                                                 student.average_score >= 40 ? 'D' : 'F'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {selectedStream && rankings.length === 0 && !loading && (
                    <div className="alert alert-info">No student data available for this stream.</div>
                )}
            </div>
        </div>
    );
}

export default Rankings;