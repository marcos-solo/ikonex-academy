import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { streamAPI, studentAPI, subjectAPI } from '../services/api';

function Dashboard() {
    const [stats, setStats] = useState({
        streams: 0,
        students: 0,
        subjects: 0
    });
    const [recentStudents, setRecentStudents] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [streamsRes, studentsRes, subjectsRes] = await Promise.all([
                streamAPI.getAll(),
                studentAPI.getAll(),
                subjectAPI.getAll()
            ]);
            
            setStats({
                streams: streamsRes.data.data.length,
                students: studentsRes.data.data.length,
                subjects: subjectsRes.data.data.length
            });
            
            setRecentStudents(studentsRes.data.data.slice(0, 5));
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <p className="eyebrow">Welcome back, administrator</p>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Insightful school metrics in one place — students, streams, subjects, and performance.</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={() => navigate('/students')}>Add student</button>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card stat-card-primary">
                    <div className="stat-label">Class Streams</div>
                    <div className="stat-value">{stats.streams}</div>
                    <div className="stat-note">Organize every student by stream and schedule.</div>
                </div>
                <div className="stat-card stat-card-secondary">
                    <div className="stat-label">Total Students</div>
                    <div className="stat-value">{stats.students}</div>
                    <div className="stat-note">Current enrollment across all classes.</div>
                </div>
                <div className="stat-card stat-card-tertiary">
                    <div className="stat-label">Subjects</div>
                    <div className="stat-value">{stats.subjects}</div>
                    <div className="stat-note">Active subjects available for assessment.</div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Recent Students</h2>
                </div>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Admission No</th>
                            <th>Name</th>
                            <th>Stream</th>
                            <th>Registered</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentStudents.map(student => (
                            <tr key={student.id}>
                                <td>{student.admission_number}</td>
                                <td>{student.full_name}</td>
                                <td>{student.stream_name || 'Not Assigned'}</td>
                                <td>{new Date(student.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Dashboard;