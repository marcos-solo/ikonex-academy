import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);

    const closeMenu = () => setMenuOpen(false);

    return (
        <>
            <nav className="navbar">
                <Link to="/" className="navbar-brand" onClick={closeMenu}>
                    <span>Ikonex</span> Academy
                </Link>

                <button
                    type="button"
                    className={`mobile-menu-button ${menuOpen ? 'open' : ''}`}
                    onClick={() => setMenuOpen(prev => !prev)}
                    aria-label="Toggle navigation"
                >
                    <span />
                    <span />
                    <span />
                </button>

                <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
                    <Link to="/" onClick={closeMenu}>Dashboard</Link>
                    <Link to="/streams" onClick={closeMenu}>Streams</Link>
                    <Link to="/students" onClick={closeMenu}>Students</Link>
                    <Link to="/subjects" onClick={closeMenu}>Subjects</Link>
                    <Link to="/scores" onClick={closeMenu}>Scores</Link>
                    <Link to="/performance" onClick={closeMenu}>Performance</Link>
                    <Link to="/rankings" onClick={closeMenu}>Rankings</Link>
                </div>
            </nav>

            <div className={`sidebar-overlay ${menuOpen ? 'active' : ''}`} onClick={closeMenu} />
        </>
    );
}

export default Navbar;