import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { streamAPI } from '../services/api';

function Streams() {
    const [streams, setStreams] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingStream, setEditingStream] = useState(null);
    const [formData, setFormData] = useState({ name: '', code: '' });
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchStreams();
    }, []);

    const fetchStreams = async () => {
        try {
            const response = await streamAPI.getAll();
            setStreams(response.data.data);
        } catch (error) {
            console.error('Error fetching streams:', error);
        }
    };

    const filteredStreams = streams.filter(stream => {
        const query = searchTerm.toLowerCase();
        return stream.name.toLowerCase().includes(query) || stream.code.toLowerCase().includes(query);
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingStream) {
                await streamAPI.update(editingStream.id, formData);
                setMessage({ type: 'success', text: 'Stream updated successfully!' });
            } else {
                await streamAPI.create(formData);
                setMessage({ type: 'success', text: 'Stream created successfully!' });
            }
            fetchStreams();
            closeModal();
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Error saving stream' });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this stream?')) {
            try {
                await streamAPI.delete(id);
                fetchStreams();
                setMessage({ type: 'success', text: 'Stream deleted successfully!' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            } catch (error) {
                setMessage({ type: 'error', text: 'Error deleting stream' });
            }
        }
    };

    const openModal = (stream = null) => {
        if (stream) {
            setEditingStream(stream);
            setFormData({ name: stream.name, code: stream.code });
        } else {
            setEditingStream(null);
            setFormData({ name: '', code: '' });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingStream(null);
        setFormData({ name: '', code: '' });
    };

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <div>
                        <h1 className="card-title">Class Streams</h1>
                        <p className="page-subtitle">Quickly search streams and manage class groupings.</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        + Add Stream
                    </button>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search streams by name or code"
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
                            <th>Stream Name</th>
                            <th>Code</th>
                            <th>Created Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStreams.length > 0 ? filteredStreams.map(stream => (
                            <tr key={stream.id}>
                                <td>{stream.id}</td>
                                <td>{stream.name}</td>
                                <td>{stream.code}</td>
                                <td>{new Date(stream.created_at).toLocaleDateString()}</td>
                                <td>
                                    <Link
                                        to={`/streams/${stream.id}`}
                                        className="btn btn-info"
                                        style={{ marginRight: '10px' }}
                                    >
                                        Details
                                    </Link>
                                    <button 
                                        className="btn btn-warning" 
                                        style={{ marginRight: '10px' }}
                                        onClick={() => openModal(stream)}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        className="btn btn-danger"
                                        onClick={() => handleDelete(stream.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '28px', color: '#94a3b8' }}>
                                    No streams matched your search.
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
                            <h2>{editingStream ? 'Edit Stream' : 'Add New Stream'}</h2>
                            <button className="btn btn-danger" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Stream Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Stream Code</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary">
                                {editingStream ? 'Update' : 'Create'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Streams;