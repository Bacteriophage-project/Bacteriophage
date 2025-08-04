import React, { useState } from 'react';
import { FaGoogle, FaTimes } from 'react-icons/fa';
import './LoginModal.css';

import { auth } from '../../firebase/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../firebase/AuthContext';

const LoginModal = ({ onClose }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const toggleMode = () => setIsSignup(!isSignup);

  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSignup) {
      if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        setUser(userCredential.user);
        onClose();
        navigate('/dashboard');
      } catch (err) {
        alert(err.message);
      }
    } else {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setUser(userCredential.user);
        onClose();
        navigate('/dashboard');
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      onClose();
      navigate('/dashboard');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="login-modal">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>
          <FaTimes />
        </button>
        <h2>{isSignup ? 'Create Account' : 'Welcome Back'}</h2>

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {isSignup && (
            <input
              type="password"
              placeholder="Confirm Password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          )}

          {!isSignup && (
            <div className="form-options">
              <label>
                <input type="checkbox" /> Remember me
              </label>
              <a href="#">Forgot password?</a>
            </div>
          )}

          <button type="submit" className="login-btn">
            {isSignup ? 'Sign Up' : 'Login'}
          </button>

          <p className="divider">OR</p>

          <button type="button" className="google-btn" onClick={handleGoogleSignIn}>
            <FaGoogle className="google-icon" /> Sign in with Google
          </button>

          <p className="signup-prompt">
            {isSignup ? (
              <>
                Already have an account?{' '}
                <span onClick={toggleMode} className="switch-link">
                  Login
                </span>
              </>
            ) : (
              <>
                Don’t have an account?{' '}
                <span onClick={toggleMode} className="switch-link">
                  Sign Up
                </span>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
