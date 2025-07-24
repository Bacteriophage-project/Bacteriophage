import React from 'react';
import './App.css';
import Home from './mainPages/Home.jsx';
import { Routes, Route } from 'react-router-dom';
import GenomeFetcher from './mainPages/GenomeFetcher.jsx';


function App() {
  return (
    <>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/genomefetcher" element={<GenomeFetcher/>}></Route>
    </Routes>
    </>
  );
}

export default App;


