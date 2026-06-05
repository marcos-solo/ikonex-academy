import React, { useState, useEffect } from 'react';
import { studentAPI, subjectAPI, scoreAPI } from '../services/api';

function Scores() {
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [formData, setFormData] = useState({
        student_id: '',
        subject_id: '',
        exam_type: 'EXAM',
        score: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchStudents();
        fetchSubjects();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await studentAPI.getAll();
            setStudents(response.data.data);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const fetchSubjects = async () => {
        try {
            const response = await subjectAPI.getAll();
            setSubjects(response.data.data);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.score < 0 || formData.score > 100) {
            setMessage({ type: 'error', text: 'Score must be between 0 and 100' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            return;
        }

        try {
            await scoreAPI.create(formData);
            setMessage({ type: 'success', text: 'Score recorded successfully!' });
            setFormData({
                student_id: '',
                subject_id: '',
                exam_type: 'EXAM',
                score: ''
            });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Error recording score' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <h1 className="card-title">Record Student Scores</h1>
                </div>

                {message.text && (
                    <div className={`alert alert-${message.type}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Student</label>
                        <select
                            className="form-control"
                            value={formData.student_id}
                            onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                            required
                        >
                            <option value="">Select Student</option>
                            {students.map(student => (
                                <option key={student.id} value={student.id}>
                                    {student.admission_number} - {student.full_name} ({student.stream_name || 'No Stream'})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Subject</label>
                        <select
                            className="form-control"
                            value={formData.subject_id}
                            onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
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

                    <div className="form-group">
                        <label>Exam Type</label>
                        <select
                            className="form-control"
                            value={formData.exam_type}
                            onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
                            required
                        >
                            <option value="CA1">Continuous Assessment 1 (CA1)</option>
                            <option value="CA2">Continuous Assessment 2 (CA2)</option>
                            <option value="EXAM">Final Examination</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Score (0-100)</label>
                        <input
                            type="number"
                            className="form-control"
                            value={formData.score}
                            onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) })}
                            min="0"
                            max="100"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary">Record Score</button>
                </form>
            </div>
        </div>
    );
}

export default Scores;