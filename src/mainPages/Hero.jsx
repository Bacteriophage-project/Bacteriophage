import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/hero.css';
import Nav from '../components/Nav';
import DnaViewer from '../components/DnaViewer';

const Hero = () => {
  return (
    <div className="Hero">
        <Nav></Nav>
        <section className="hero">
          <div className="hero-content">
            <h1 className="hero-title">Welcome to Bacteriophage</h1>
            <h3 className="hero-subtitle">Phage Genomics, Simplified.</h3>
            <p className="hero-text">Explore, analyze, and visualize phage and bacterial genomes with our integrated platform built for researchers and scientists. Seamlessly fetch genomic data from NCBI, detect antimicrobial resistance using advanced tools like ResFinder, and uncover phage-host interactions through intuitive visualizations. Accelerate your research with automation, precision, and scientific insight — all in one place.</p>
            
            <Link to='/genomefetcher' target='#' className="hero-button">Start Analyzing</Link>
          </div>

          <div className="dna">
            <DnaViewer></DnaViewer>
          </div>
        </section>
    </div>
  );
};

export default Hero;
