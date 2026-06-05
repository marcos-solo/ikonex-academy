import React, { useState, useEffect } from 'react';
import { subjectAPI, streamAPI } from '../services/api';

function Subjects() {
    const [subjects, setSubjects] = useState([]);
    const [streams, setStreams] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [formData, setFormData] = useState({ name: '', code: '' });
    const [assignData, setAssignData] = useState({ stream_id: '', subject_id: '' });
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchSubjects();
        fetchStreams();
    }, []);

    const fetchSubjects = async () => {
        try {
            const response = await subjectAPI.getAll();
            setSubjects(response.data.data);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const filteredSubjects = subjects.filter(subject => {
        const query = searchTerm.toLowerCase();
        return subject.name.toLowerCase().includes(query) || subject.code.toLowerCase().includes(query);
    });

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
            if (editingSubject) {
                await subjectAPI.update(editingSubject.id, formData);
                setMessage({ type: 'success', text: 'Subject updated successfully!' });
            } else {
                await subjectAPI.create(formData);
                setMessage({ type: 'success', text: 'Subject created successfully!' });
            }
            fetchSubjects();
            closeModal();
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Error saving subject' });
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        try {
            await subjectAPI.assignToStream(assignData);
            setMessage({ type: 'success', text: 'Subject assigned to stream successfully!' });
            setShowAssignModal(false);
            setAssignData({ stream_id: '', subject_id: '' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Error assigning subject' });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this subject?')) {
            try {
                await subjectAPI.delete(id);
                fetchSubjects();
                setMessage({ type: 'success', text: 'Subject deleted successfully!' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            } catch (error) {
                setMessage({ type: 'error', text: 'Error deleting subject' });
            }
        }
    };

    const openModal = (subject = null) => {
        if (subject) {
            setEditingSubject(subject);
            setFormData({ name: subject.name, code: subject.code });
        } else {
            setEditingSubject(null);
            setFormData({ name: '', code: '' });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingSubject(null);
        setFormData({ name: '', code: '' });
    };

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <div>
                        <h1 className="card-title">Subjects Management</h1>
                        <p className="page-subtitle">Create subjects and assign them to streams quickly.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button className="btn btn-success" style={{ marginRight: '10px' }} onClick={() => setShowAssignModal(true)}>
                            Assign to Stream
                        </button>
                        <button className="btn btn-primary" onClick={() => openModal()}>
                            + Add Subject
                        </button>
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search subjects by name or code"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
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
                            <th>ID</th>
                            <th>Subject Name</th>
                            <th>Subject Code</th>
                            <th>Created Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSubjects.length > 0 ? filteredSubjects.map(subject => (
                            <tr key={subject.id}>
                                <td>{subject.id}</td>
                                <td>{subject.name}</td>
                                <td>{subject.code}</td>
                                <td>{new Date(subject.created_at).toLocaleDateString()}</td>
                                <td>
                                    <button 
                                        className="btn btn-warning" 
                                        style={{ marginRight: '10px' }}
                                        onClick={() => openModal(subject)}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        className="btn btn-danger"
                                        onClick={() => handleDelete(subject.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '28px', color: '#94a3b8' }}>
                                    No subjects matched your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                </div>
            </div>

            {/* Add/Edit Subject Modal */}
            {showModal && (
                <div className="modal" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</h2>
                            <button className="btn btn-danger" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Subject Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Subject Code</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary">
                                {editingSubject ? 'Update' : 'Create'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Subject to Stream Modal */}
            {showAssignModal && (
                <div className="modal" onClick={() => setShowAssignModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Assign Subject to Class Stream</h2>
                            <button className="btn btn-danger" onClick={() => setShowAssignModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleAssign}>
                            <div className="form-group">
                                <label>Class Stream</label>
                                <select
                                    className="form-control"
                                    value={assignData.stream_id}
                                    onChange={(e) => setAssignData({ ...assignData, stream_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select Stream</option>
                                    {streams.map(stream => (
                                        <option key={stream.id} value={stream.id}>
                                            {stream.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Subject</label>
                                <select
                                    className="form-control"
                                    value={assignData.subject_id}
                                    onChange={(e) => setAssignData({ ...assignData, subject_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select Subject</option>
                                    {subjects.map(subject => (
                                        <option key={subject.id} value={subject.id}>
                                            {subject.name} ({subject.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary">Assign</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Subjects;