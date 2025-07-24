import React from 'react';
import '../styles/navbar.css';
import logo from '../assets/logo.png'; // Adjust the path if needed

const Nav = () => {
  return (
    <nav className="navbar">
      <div className="logo-section">
        <img src={logo} alt="Logo" className="logo" />
        <span className="site-title">BacterioPhage</span>
      </div>
      <ul className="nav-links">
        <li className='nav-link'><a href="#home">Home</a></li>
        <li className='nav-link'><a href="#about">About</a></li>
        <li className='nav-link'><a href="#services">Services</a></li>
      </ul>

      <button className="check-in">Log In</button>
    </nav>
  );
};

export default Nav;
