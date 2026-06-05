import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Streams from './pages/Streams';
import StreamDetail from './pages/StreamDetail';
import Students from './pages/Students';
import Subjects from './pages/Subjects';
import Scores from './pages/Scores';
import Rankings from './pages/Rankings';
import ClassPerformance from './pages/ClassPerformance';
import StudentDetail from './pages/StudentDetail';
import './App.css';

function App() {
    return (
        <Router>
            <div className="App">
                <Navbar />
                <div className="container">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/streams" element={<Streams />} />
                        <Route path="/streams/:id" element={<StreamDetail />} />
                        <Route path="/students" element={<Students />} />
                        <Route path="/students/:id" element={<StudentDetail />} />
                        <Route path="/subjects" element={<Subjects />} />
                        <Route path="/scores" element={<Scores />} />
                        <Route path="/performance" element={<ClassPerformance />} />
                        <Route path="/rankings" element={<Rankings />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;