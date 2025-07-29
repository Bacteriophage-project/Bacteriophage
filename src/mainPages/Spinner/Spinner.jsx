//Spinner.js (components directory)………                                                                                                                        import React from 'react';

export default function Spinner({ text = "Loading..." }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "9px", color: "#1976d2", fontWeight: 500, fontSize: "16px"
    }}>
      <div className="loading-spinner" style={{
        width: "18px", height: "18px", border: "2px solid #1976d2",
        borderTop: "2px solid #fff", borderRadius: "50%",
        animation: "spin .8s linear infinite"
      }} />
      <span>{text}</span>
      <style>
        {`
        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
        `}
      </style>
    </div>
  );
}