import React from 'react';
import './App.css';
import Home from './mainPages/Home.jsx';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './Routes/ProtectedRoute.jsx'; // Import it
import Dashboard from './mainPages/Dashboard';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/genomefetcher" 
          element={
            <ProtectedRoute>
              <Dashboard/>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </>
  );
}

export default App;
