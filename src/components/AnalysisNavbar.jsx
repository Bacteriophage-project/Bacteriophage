import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/analysisNavbar.css'; // New unique CSS file

import logo from '../assets/logo.png'; // Replace with your actual logo path

const AnalysisNavbar = () => {
    return (
        <nav className="analysis-nav">
            <div className="analysis-nav-brand">
                <img src={logo} alt="Logo" className="analysis-nav-logo" />
                <span className="analysis-nav-title">Bacteriophage Analysis</span>
            </div>
            <ul className="analysis-nav-links">
                <li><Link to="/" className="analysis-nav-link">Home</Link></li>
                <li><Link to="/help" className="analysis-nav-link">Help</Link></li>
                <li><Link to="/analysis" className="analysis-nav-link">Analysis</Link></li>
            </ul>
        </nav>
    );
};

export default AnalysisNavbar;
