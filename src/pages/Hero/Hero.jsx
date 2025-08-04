import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './hero.css';
import Nav from '../../components/Nav/Nav';
import DnaViewer from '../../components/DnaViewer';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebase'; // adjust if path is different

const Hero = () => {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const useAuth = process.env.REACT_APP_USE_AUTH === 'true';

  const handleStartAnalyzing = () => {
    if (useAuth && !user) {
      alert('Please log in to access the analysis tools.');
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div className="Hero">
      <Nav />
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to Bacteriophage</h1>
          <h3 className="hero-subtitle">Phage Genomics, Simplified.</h3>
          <p className="hero-text">
            Explore, analyze, and visualize phage and bacterial genomes with our integrated platform built for researchers and scientists. Seamlessly fetch genomic data from NCBI, detect antimicrobial resistance using advanced tools like ResFinder, and uncover phage-host interactions through intuitive visualizations. Accelerate your research with automation, precision, and scientific insight — all in one place.
          </p>

          <button className="hero-button" onClick={handleStartAnalyzing}>
            Start Analyzing
          </button>
        </div>

        <div className="dna">
          <DnaViewer />
        </div>
      </section>
    </div>
  );
};

export default Hero;
