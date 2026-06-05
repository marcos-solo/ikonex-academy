import React, { useState, useEffect } from 'react';
import { studentAPI, streamAPI } from '../services/api';
import { Link } from 'react-router-dom';

function Students() {
    const [students, setStudents] = useState([]);
    const [streams, setStreams] = useState([]);
    const [selectedStream, setSelectedStream] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [formData, setFormData] = useState({ full_name: '', stream_id: '' });
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchStudents();
        fetchStreams();
    }, []);

    const fetchStudents = async (streamId = '') => {
        try {
            const response = streamId ? await studentAPI.getByStream(streamId) : await studentAPI.getAll();
            setStudents(response.data.data);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const fetchStreams = async () => {
        try {
            const response = await streamAPI.getAll();
            setStreams(response.data.data);
        } catch (error) {
            console.error('Error fetching streams:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingStudent) {
                await studentAPI.update(editingStudent.id, formData);
                setMessage({ type: 'success', text: 'Student updated successfully!' });
            } else {
                await studentAPI.create(formData);
                setMessage({ type: 'success', text: 'Student created successfully!' });
            }
            fetchStudents();
            closeModal();
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Error saving student' });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this student?')) {
            try {
                await studentAPI.delete(id);
                fetchStudents();
                setMessage({ type: 'success', text: 'Student deleted successfully!' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            } catch (error) {
                setMessage({ type: 'error', text: 'Error deleting student' });
            }
        }
    };

    const openModal = (student = null) => {
        if (student) {
            setEditingStudent(student);
            setFormData({ 
                full_name: student.full_name, 
                stream_id: student.stream_id || '' 
            });
        } else {
            setEditingStudent(null);
            setFormData({ full_name: '', stream_id: '' });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingStudent(null);
        setFormData({ full_name: '', stream_id: '' });
    };

    const filteredStudents = students.filter(student => {
        const search = searchTerm.toLowerCase();
        const textMatch = student.full_name.toLowerCase().includes(search) ||
            student.admission_number.toLowerCase().includes(search) ||
            (student.stream_name || '').toLowerCase().includes(search);
        return textMatch;
    });

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <div>
                        <h1 className="card-title">Students Management</h1>
                        <p className="page-subtitle">Search students by name, admission number or stream, then filter by class.</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        + Register Student
                    </button>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search by name, student ID, or stream"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="form-group" style={{ marginBottom: '0', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <select
                        className="form-control"
                        value={selectedStream}
                        onChange={(e) => {
                            const streamId = e.target.value;
                            setSelectedStream(streamId);
                            fetchStudents(streamId);
                        }}
                        style={{ minWidth: '220px', flex: '1' }}
                    >
                        <option value="">All Streams</option>
                        {streams.map(stream => (
                            <option key={stream.id} value={stream.id}>
                                {stream.name}
                            </option>
                        ))}
                    </select>
                </div>

                {message.text && (
                    <div className={`alert alert-${message.type}`}>
                        {message.text}
                    </div>
                )}

                <div className="table-responsive">
                    <table className="table">
                        <thead>
                        <tr>
                            <th>Admission No</th>
                            <th>Full Name</th>
                            <th>Stream</th>
                            <th>Registered Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.length > 0 ? filteredStudents.map(student => (
                            <tr key={student.id}>
                                <td>{student.admission_number}</td>
                                <td>
                                    <Link to={`/students/${student.id}`} style={{ color: '#667eea', textDecoration: 'none' }}>
                                        {student.full_name}
                                    </Link>
                                </td>
                                <td>{student.stream_name || 'Not Assigned'}</td>
                                <td>{new Date(student.created_at).toLocaleDateString()}</td>
                                <td>
                                    <button 
                                        className="btn btn-warning" 
                                        style={{ marginRight: '10px' }}
                                        onClick={() => openModal(student)}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        className="btn btn-danger"
                                        onClick={() => handleDelete(student.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '28px', color: '#94a3b8' }}>
                                    No students matched your search or filter.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                </div>
            </div>

            {showModal && (
                <div className="modal" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingStudent ? 'Edit Student' : 'Register New Student'}</h2>
                            <button className="btn btn-danger" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Class Stream</label>
                                <select
                                    className="form-control"
                                    value={formData.stream_id}
                                    onChange={(e) => setFormData({ ...formData, stream_id: e.target.value })}
                                >
                                    <option value="">Select Stream</option>
                                    {streams.map(stream => (
                                        <option key={stream.id} value={stream.id}>
                                            {stream.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary">
                                {editingStudent ? 'Update' : 'Register'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Students;