import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-logo">
          🦠 <span>Bacteriophage</span>
        </div>
        <nav className="footer-links">
          <a href="/">Home</a>
          <a href="/analyze">Analyze</a>
          <a href="/docs">Documentation</a>
          <a href="/team">Team</a>
          <a href="/contact">Contact</a>
        </nav>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Bacteriophage Research Platform. All rights reserved.</p>
        <p>Built with ❤️ for genomic insights.</p>
      </div>
    </footer>
  );
};

export default Footer;
