import React, { useEffect, useState } from 'react';
import './navbar.css';
import logo from '../../assets/logo.png';
import LoginModal from '../../pages/Login/LoginModal';
import { auth } from '../../firebase/firebase'; // Make sure this is your Firebase auth setup
import { onAuthStateChanged } from 'firebase/auth';

const Nav = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const name = user.displayName || user.email.split('@')[0];
        setUserName(name.toUpperCase());
      } else {
        setUserName(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const openLogin = () => setShowLogin(true);
  const closeLogin = () => setShowLogin(false);

  return (
    <>
      <nav className="navbar">
        <div className="logo-section">
          <img src={logo} alt="Logo" className="logo" />
          <span className="site-title">BacterioPhage</span>
        </div>
        <ul className="nav-links">
          <li className="nav-link"><a href="#home">Home</a></li>
          <li className="nav-link"><a href="#about">About</a></li>
          <li className="nav-link"><a href="#services">Services</a></li>
        </ul>

        {userName ? (
          <div className="user-name">{userName}</div>
        ) : (
          <button className="check-in" onClick={openLogin}>Log In</button>
        )}
      </nav>

      {showLogin && <LoginModal onClose={closeLogin} />}
    </>
  );
};

export default Nav;
