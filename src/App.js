import React from 'react';
import './App.css';
import Home from './mainPages/Home.jsx';
import GenomeFetcher from './mainPages/GenomeFetcher.jsx';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './Routes/ProtectedRoute.jsx'; // Import it

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/genomefetcher" 
          element={
            <ProtectedRoute>
              <GenomeFetcher />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </>
  );
}

export default App;
