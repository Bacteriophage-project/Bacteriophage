import React, { useState } from 'react';
import '../styles/general.css';
import GenomeCard from '../components/GenomeCard';
import AnalysisNavbar from '../components/AnalysisNavbar';
import axios from 'axios';
import Spinner from './Spinner/Spinner'; // Make sure Spinner component exists

const BACKEND_BASE_URL = 'http://10.5.16.108:8000';

const MODULES = [
  { key: "resfinder", label: "ResFinder" },
  { key: "vfdb", label: "VFDB" },
  { key: "phastest", label: "Phastest" },
];

// Backend endpoints must match FastAPI routes exactly (with slashes)
const toolEndpoint = {
  resfinder: "run/resfinder",
  vfdb: "run/vfdb",
  phastest: "run/phastest"
};

const toolLabels = {
  resfinder: "ResFinder AMR Results",
  vfdb: "VFDB Virulence Results",
  phastest: "Phastest Phage Results"
};

const toolLoadingText = {
  resfinder: "Running ResFinder analysis...",
  vfdb: "Running VFDB gene profiling...",
  phastest: "Running Phastest phage detection..."
};

const GenomeFetcher = () => {
  const [bioprojectNo, setBioprojectNo] = useState('');
  const [genomes, setGenomes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // for genome fetch
  const [moduleLoading, setModuleLoading] = useState({});
  const [results, setResults] = useState({});

  // Fetch genomes based on BioProject number
  const fetchGenome = async (bioNumber) => {
    if (!bioNumber) {
      setError("Please enter a BioProject number.");
      return;
    }
    setLoading(true);
    setError('');
    setGenomes([]);
    setResults({});
    try {
      const response = await axios.get(`${BACKEND_BASE_URL}/assemblies`, {
        params: { bioproject_id: bioNumber }
      });
      console.log(response.data);
      if (response.data.error) {
        setError(response.data.error);
        setGenomes([]);
      } else {
        setGenomes(response.data.assemblies || []);
        if (!response.data.assemblies || response.data.assemblies.length === 0) {
          setError("No assemblies found for this BioProject ID. Please check the number.");
        }
      }
    } catch (err) {
      setError("Failed to fetch genomes. Please check your network connection or try again later. (Backend might be down or inaccessible).");
      setGenomes([]);
    } finally {
      setLoading(false);
    }
  };

  // Handler for running each analysis module (ResFinder, VFDB, Phastest)
  const runModule = async (moduleKey) => {
    if (!genomes.length) {
      setError("No genomes available. Fetch them first!");
      return;
    }
    setError('');
    setModuleLoading((prev) => ({ ...prev, [moduleKey]: true }));

    try {
      const response = await axios.post(`${BACKEND_BASE_URL}/${toolEndpoint[moduleKey]}`);
      if (response.data) {
        setResults((prev) => ({
          ...prev,
          [moduleKey]: response.data
        }));
      } else {
        setError(`No results from ${moduleKey}.`);
      }
    } catch (err) {
      setError(
        `Error running ${moduleKey}: ${
          err.response
            ? `${err.response.status} - ${err.response.data.detail || err.response.statusText}`
            : err.message
        }`
      );
    } finally {
      setModuleLoading((prev) => ({ ...prev, [moduleKey]: false }));
    }
  };

  // Render the results table for a given module
  const renderModuleResults = (moduleKey) => {
    const data = results[moduleKey];
    if (!data) return null;

    const { parsed_results, spreadsheet_link, results: alt_results, spreadsheetLink: alt_spreadsheet_link } = data;
    const final_results = parsed_results || alt_results;
    const file_link = spreadsheet_link || alt_spreadsheet_link;

    return (
      <div style={{ margin: "18px 0", background: "#fbfbfc", border: "1px solid #e0e0e0", borderRadius: 9, padding: 20 }}>
        <h4 style={{ marginBottom: 8 }}>{toolLabels[moduleKey]}</h4>
        {file_link && (
          <div style={{ marginBottom: 8 }}>
            <a href={file_link} target="_blank" rel="noopener noreferrer" download style={{ color: "#1976d2", fontWeight: "bold" }}>
              ⬇ Download spreadsheet/report
            </a>
          </div>
        )}
        {final_results && Array.isArray(final_results) && final_results.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ fontSize: 14, width: '100%', borderCollapse: "collapse", marginTop: 4 }}>
              <thead>
                <tr>
                  {Object.keys(final_results[0]).map((k) => (
                    <th key={k} style={{ padding: "2px 12px", borderBottom: "1px solid #e0e0e0" }}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {final_results.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((v, vi) => (
                      <td key={vi} style={{ padding: "2px 12px", borderBottom: "1px solid #f0f0f0" }}>{v != null ? String(v) : ""}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: "#777" }}>No results found for this module.</div>
        )}
      </div>
    );
  };

  return (
    <div className="container">
      <AnalysisNavbar />
      <div className="wrapper">
        <h3>Fetch Genomes</h3>
        <input
          className='bioproject-input'
          type="text"
          value={bioprojectNo}
          onChange={(e) => setBioprojectNo(e.target.value)}
          placeholder='Enter your BioProject number (e.g., PRJNA918859)'
        />
        <p><strong>BioProject: </strong> {bioprojectNo}</p>
        <button
          className="fetchButton"
          onClick={() => fetchGenome(bioprojectNo)}
          disabled={loading}
        >
          {loading ? <Spinner text="Fetching Genomes..." /> : "Fetch genomes"}
        </button>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

        {genomes.length > 0 && (
          <div className="results" style={{ marginTop: 22 }}>
            <h4>Fetched Assemblies:</h4>
            <ul className='genomes'>
              {genomes.map((genome, index) => (
                <GenomeCard key={index} genome={genome} />
              ))}
            </ul>

            {/* Run buttons */}
            <div style={{ margin: "18px 0", display: "flex", gap: 16 }}>
              {MODULES.map((mod) => (
                <button
                  key={mod.key}
                  className={`run-btn ${mod.key}`}
                  onClick={() => runModule(mod.key)}
                  disabled={moduleLoading[mod.key]}
                  style={{
                    minWidth: 140,
                    fontSize: "16px",
                    fontWeight: "bold",
                    position: "relative"
                  }}
                >
                  {moduleLoading[mod.key]
                    ? <Spinner text={toolLoadingText[mod.key]} />
                    : <>Run {mod.label}</>
                  }
                </button>
              ))}
            </div>
            {/* Results w/ inline spinner per module */}
            {MODULES.map((mod) => (
              <div key={mod.key}>
                {moduleLoading[mod.key] && (
                  <Spinner text={toolLoadingText[mod.key]} />
                )}
                {results[mod.key] && renderModuleResults(mod.key)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GenomeFetcher;