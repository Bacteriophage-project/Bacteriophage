import React, { useState } from 'react';

const GenomeCard = ({ genome }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="genome-card">
      <h4 className='genome-organism'>{genome.organism || 'Unknown organism'}</h4>
      <p className='accession'><strong>Accession:</strong> {genome.assembly_accession || 'N/A'}</p>


      {genome.description && (
        <p className='description'><strong>Description:</strong><br />
          {genome.description.split('\n').map((line, i) => (
            <span key={i}>{line}<br /></span>
          ))}
        </p>
      )}

      <button onClick={() => setShowDetails(!showDetails)} className='show-detail-button'>
        {showDetails ? 'Hide Details' : 'View More'}
      </button>

      {showDetails && (
        <div className="details">
          <h5>Genomes in Assembly:</h5>
          {genome.genomes && genome.genomes.length > 0 ? (
            <ul className='details-list'>
              {genome.genomes.map((g, idx) => {
                const info = g.info || {};
                return (
                  <li key={idx} className='details-list'>
                    <p className='detail-item'><strong>Accession:</strong> {info.accession || 'N/A'}</p>
                    <p className='detail-item'><strong>Organism:</strong> {info.organism || 'N/A'}</p>
                    <p className='detail-item'><strong>File Path:</strong> {info.file || 'N/A'}</p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>No genome details available.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default GenomeCard;