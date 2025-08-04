import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
/*import CssBaseline from '@mui/material/CssBaseline';*/
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import Dashboard from './pages/Dashboard';
import Results from './pages/Results';
import Jobs from './pages/Jobs';
import Home from './pages/Home';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});


function App() {
  return (
    <>
    <ThemeProvider theme={theme} >
      {/*<CssBaseline />*/}
      <Router>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: "0" }}>
          <Container maxWidth="xl" sx={{ flex: 1, p: 0 }}>
            <Routes>
              <Route path='/' element={<Home/>}></Route>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/results" element={<Results />} />
              <Route path="/jobs" element={<Jobs />} />
            </Routes>
          </Container>
        </div>
      </Router>
    </ThemeProvider>
    </>
  );
}

export default App; 