import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { streamAPI } from '../services/api';

function StreamDetail() {
    const { id } = useParams();
    const [stream, setStream] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStream = async () => {
            try {
                const response = await streamAPI.getById(id);
                setStream(response.data.data);
            } catch (error) {
                console.error('Error fetching stream details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStream();
    }, [id]);

    if (loading) return <div className="no-data">Loading stream details...</div>;
    if (!stream) return <div className="no-data">Stream not found</div>;

    return (
        <div>
            <Link to="/streams" className="page-back">
                ← Back to Streams
            </Link>

            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <h1 className="card-title">{stream.name}</h1>
                </div>

                <div className="info-grid">
                    <div className="info-card">
                        <h3>Stream Information</h3>
                        <p><strong>Name:</strong> {stream.name}</p>
                        <p><strong>Code:</strong> {stream.code}</p>
                        <p><strong>Students Assigned:</strong> {stream.student_count}</p>
                        <p><strong>Created At:</strong> {new Date(stream.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="info-card">
                        <h3>Assigned Subjects</h3>
                        {stream.subjects.length > 0 ? (
                            <ul>
                                {stream.subjects.map(subject => (
                                    <li key={subject.id}>{subject.name} ({subject.code})</li>
                                ))}
                            </ul>
                        ) : (
                            <p>No subjects assigned to this stream yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StreamDetail;
