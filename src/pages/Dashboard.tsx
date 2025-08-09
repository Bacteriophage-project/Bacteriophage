import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  BugReport as BugIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  WifiOff as WifiOffIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';
import type { GenomeData } from '../services/api';

interface JobStatus {
  job_id: string;
  job_type: 'resfinder' | 'phastest' | 'vfdb';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'stopped';
  progress: number;
  result: { [key: string]: any; fallback_zip_path?: string; };
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

interface FileStatus {
  resfinder: boolean;
  vfdb: boolean;
  phastest: boolean;
  resfinder_path?: string;
  vfdb_path?: string;
  phastest_dir?: string;
}



const Dashboard = () => {
  const [analysisJobs, setAnalysisJobs] = useState<{ [key: string]: JobStatus }>({});
  const [fileStatus, setFileStatus] = useState<{ [key: string]: FileStatus }>({});
  
  const [loading, setLoading] = useState(false);
  const [bioprojectId, setBioprojectId] = useState('');
  const [genomes, setGenomes] = useState<GenomeData[]>([]);
  const [fetchingGenomes, setFetchingGenomes] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; jobId: string; action: string; type: string }>({
    open: false,
    jobId: '',
    action: '',
    type: ''
  });
  const [phastestZipFiles, setPhastestZipFiles] = useState<Array<{ filename: string; size_mb: number }>>([]);
  const [loadingZipFiles, setLoadingZipFiles] = useState(false);

  const analysisJobsRef = useRef(analysisJobs);
  analysisJobsRef.current = analysisJobs;

  

  // File-based job status checking
  useEffect(() => {
    const checkFiles = async () => {
      const currentJobs = analysisJobsRef.current;
      const jobsToCheck = Object.entries(currentJobs).filter(([_, job]) => 
        job && ['pending', 'running'].includes(job.status)
      );

      for (const [type, job] of jobsToCheck) {
        try {
          const response = await fetch(`https://ninety-jars-flow.loca.lt/api/check-files/${job.job_id}`);
          if (response.ok) {
            const files = await response.json();
            setFileStatus(prev => ({ ...prev, [job.job_id]: files }));

            // Check if job is actually completed based on files
            let isCompleted = false;
            if (type === 'resfinder' && files.resfinder) isCompleted = true;
            if (type === 'vfdb' && files.vfdb) isCompleted = true;
            if (type === 'phastest' && files.phastest) isCompleted = true;

            if (isCompleted && job.status !== 'completed') {
              console.log(`🎉 Job ${job.job_id} completed (file detected)`);
            setAnalysisJobs(prev => ({
              ...prev,
                [type]: { ...job, status: 'completed' as const, completed_at: new Date().toISOString() }
              }));
            }
          }
        } catch (error) {
          console.error(`Error checking files for ${type}:, error`);
        }
      }
    };

    const interval = setInterval(checkFiles, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Load PHASTEST zip files
  const loadPhastestZipFiles = async () => {
    setLoadingZipFiles(true);
    try {
      const response = await apiService.listPhastestZipFiles();
      setPhastestZipFiles(response.zip_files);
    } catch (error) {
      console.error('Error loading PHASTEST zip files:', error);
    } finally {
      setLoadingZipFiles(false);
    }
  };

  // Download PHASTEST zip files
  const handleDownloadPhastestZip = async () => {
    try {
      const blob = await apiService.downloadPhastestZip();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'phastest_results.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSnackbar({
        open: true,
        message: 'PHASTEST results downloaded successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error downloading PHASTEST zip:', error);
      setSnackbar({
        open: true,
        message: 'Failed to download PHASTEST results',
        severity: 'error'
      });
    }
  };

  // Download FASTA files for manual PHASTEST submission
  const handleDownloadFastaFiles = async () => {
    if (genomes.length === 0) {
      setSnackbar({
        open: true,
        message: 'No genomes available for download',
        severity: 'warning'
      });
      return;
    }

    try {
      const blob = await apiService.downloadFastaFiles(genomes);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'genomes_for_phastest.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSnackbar({
        open: true,
        message: 'FASTA files downloaded! You can now submit them manually to phastest.ca',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error downloading FASTA files:', error);
      setSnackbar({
        open: true,
        message: 'Failed to download FASTA files',
        severity: 'error'
      });
    }
  };

  const handleRunAnalysis = async (type: 'resfinder' | 'phastest' | 'vfdb') => {
    if (type === 'phastest' && (!analysisJobs.resfinder || analysisJobs.resfinder.status !== 'completed')) {
      setSnackbar({ open: true, message: 'ResFinder analysis must be completed successfully first.', severity: 'warning' });
      return;
    }
    

    if (genomes.length === 0) {
      setSnackbar({ open: true, message: 'Please fetch genomes first before running analysis', severity: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.runAnalysis(type, genomes);
      const jobId = response.job_id;

      // Check if the backend returned a failed status (e.g., PHASTEST API down)
      if (response.status === 'failed') {
        const newJob: JobStatus = {
          job_id: jobId,
          job_type: type,
          status: 'failed',
          progress: 0,
          result: response.fallback_zip_path ? { fallback_zip_path: response.fallback_zip_path } : {},
          error: response.error || null,
          created_at: new Date().toISOString(),
          completed_at: null
        };
        setAnalysisJobs(prev => ({ ...prev, [type]: newJob }));
        setSnackbar({ open: true, message: response.error || `${type.toUpperCase()} analysis failed`, severity: 'error' });
      } else {
        // Normal successful start
        const newJob: JobStatus = {
          job_id: jobId,
          job_type: type,
          status: 'running',
          progress: 0,
          result: {},
          error: null,
          created_at: new Date().toISOString(),
          completed_at: null
        };
        setAnalysisJobs(prev => ({ ...prev, [type]: newJob }));
        setSnackbar({ 
          open: true, 
          message: `${type.toUpperCase()} analysis started successfully!`, 
          severity: 'success' });
      }
    } catch (error: any) {
      console.error(`Error starting ${type} analysis:, error`);
      console.log('Full error response:', error.response?.data); // Debug log
      const errorMessage = type === 'phastest'
        ? 'The PHASTEST API is currently unavailable. Please try again later.'
        : error.response?.data?.error || `Failed to start ${type} analysis`;

      if (type === 'phastest') {
        // For PHASTEST, check if the backend returned fallback_zip_path
        const fallbackZipPath = error.response?.data?.fallback_zip_path;
        console.log('Fallback zip path from backend:', fallbackZipPath); // Debug log
        setAnalysisJobs(prev => ({
          ...prev,
          [type]: {
            ...(prev[type] || {}),
            status: 'failed',
            error: errorMessage,
            result: fallbackZipPath ? { fallback_zip_path: fallbackZipPath } : {}
          } as JobStatus
        }));
      }

      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleStopJob = async (jobId: string, type: string) => {
    try {
      const response = await fetch(`https://ninety-jars-flow.loca.lt/api/job-control/${jobId}/stop`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setAnalysisJobs(prev => ({
          ...prev,
          [type]: { ...prev[type], status: 'stopped' as const, error: 'Job stopped by user' }
        }));
        setSnackbar({
          open: true,
          message: 'Job stopped successfully',
          severity: 'info'
        });
      }
    } catch (error) {
      console.error('Error stopping job:', error);
      setSnackbar({
        open: true,
        message: 'Failed to stop job',
        severity: 'error'
      });
    }
  };

  const handleResumeJob = async (jobId: string, type: string) => {
    try {
      const response = await fetch(`https://ninety-jars-flow.loca.lt/api/job-control/${jobId}/resume`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setAnalysisJobs(prev => ({
          ...prev,
          [type]: { ...prev[type], status: 'pending' as const, error: null }
        }));
        setSnackbar({
          open: true,
          message: 'Job resumed successfully',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error resuming job:', error);
      setSnackbar({
        open: true,
        message: 'Failed to resume job',
        severity: 'error'
      });
    }
  };

  const handleDownloadFallbackZip = async (jobId: string) => {
    try {
      const response = await fetch(`https://ninety-jars-flow.loca.lt/api/download-fallback-zip/${jobId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'phastest_submission.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setSnackbar({
          open: true,
          message: 'Fallback ZIP file downloaded successfully!',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to download fallback ZIP file');
      }
    } catch (error) {
      console.error('Fallback ZIP download error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to download fallback ZIP file',
        severity: 'error'
      });
    }
  };

  const handleDownload = async (type: string, jobId: string) => {
    try {
      const currentFileStatus = fileStatus[jobId];
      if (!currentFileStatus) return;

      let filePath = '';
      if (type === 'resfinder' && currentFileStatus.resfinder_path) {
        filePath = currentFileStatus.resfinder_path;
      } else if (type === 'vfdb' && currentFileStatus.vfdb_path) {
        filePath = currentFileStatus.vfdb_path;
      } else if (type === 'phastest' && currentFileStatus.phastest_dir) {
        filePath = currentFileStatus.phastest_dir;
      }

      if (filePath) {
        const response = await fetch(`https://ninety-jars-flow.loca.lt/api/download/${jobId}/${type}_csv`);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${type}_results_${jobId}.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          setSnackbar({
            open: true,
            message: 'Download started successfully!',
            severity: 'success'
          });
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      setSnackbar({
        open: true,
        message: 'Download failed',
        severity: 'error'
      });
    }
  };

  const handleFetchGenomes = async () => {
    if (!bioprojectId.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter a BioProject ID',
        severity: 'warning'
      });
      return;
    }

    

    setFetchingGenomes(true);
    try {
      const response = await apiService.fetchGenomes(bioprojectId.trim());
      const jobId = response.job_id;
      
      // Poll for the job completion
      const pollInterval = setInterval(async () => {
        try {
          const jobStatus = await apiService.getJobStatus(jobId);
          
          if (jobStatus.status === 'completed') {
            clearInterval(pollInterval);
            setFetchingGenomes(false);
            
            if (jobStatus.result && jobStatus.result.genomes) {
              setGenomes(jobStatus.result.genomes);
              setSnackbar({
                open: true,
                message: `Successfully fetched ${jobStatus.result.count} genomes for BioProject ${bioprojectId}`,
                severity: 'success'
              });
            }
          } else if (jobStatus.status === 'failed') {
            clearInterval(pollInterval);
            setFetchingGenomes(false);
            setSnackbar({
              open: true,
              message: jobStatus.error || 'Failed to fetch genomes',
              severity: 'error'
            });
          }
        } catch (error) {
          console.error('Error polling genome fetch job:', error);
        }
      }, 2000); // Poll every 2 seconds
      
      // Set a timeout to stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (fetchingGenomes) {
          setFetchingGenomes(false);
          setSnackbar({
            open: true,
            message: 'Genome fetching timed out',
            severity: 'error'
          });
        }
      }, 300000); // 5 minutes
      
    } catch (error: any) {
      console.error('Error fetching genomes:', error);
      setFetchingGenomes(false);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to fetch genomes',
        severity: 'error'
      });
    }
  };

  const handleRefreshStatus = async (jobId: string, type: string) => {
    try {
      let jobStatus = await apiService.getJobStatus(jobId);
      const files = await apiService.checkFiles(jobId);

      // Force status to completed if result file exists, especially for vfdb
      if (jobStatus.status !== 'completed' && files.vfdb && type === 'vfdb') {
        jobStatus.status = 'completed';
      }

      setAnalysisJobs(prev => ({
        ...prev,
        [type]: {
          ...jobStatus,
          job_type: jobStatus.job_type as 'resfinder' | 'phastest' | 'vfdb',
          status: jobStatus.status as 'pending' | 'running' | 'completed' | 'failed' | 'stopped'
        }
      }));

      setFileStatus(prev => ({ ...prev, [jobId]: files }));

      setSnackbar({ 
        open: true, 
        message: `Status refreshed: ${jobStatus.status}`, 
        severity: 'info' });
    } catch (error: any) {
      console.error('Error refreshing status:', error);
      setSnackbar({ open: true, message: 'Failed to refresh status', severity: 'error' });
    }
  };

  const getAnalysisIcon = (type: string) => {
    switch (type) {
      case 'resfinder': return <BugIcon />;
      case 'phastest': return <PlayIcon />;
      case 'vfdb': return <InfoIcon />;
      default: return <InfoIcon />;
    }
  };

  const getAnalysisTitle = (type: string) => {
    switch (type) {
      case 'resfinder': return 'ResFinder (AMR)';
      case 'phastest': return 'PHASTEST (Prophages)';
      case 'vfdb': return 'VFDB (Virulence Factors)';
      default: return type.toUpperCase();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'running': return 'primary';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'stopped': return 'default';
      default: return 'default';
    }
  };

  const renderAnalysisCard = (type: 'resfinder' | 'phastest' | 'vfdb', job?: JobStatus) => {
    const isCompleted = job?.status === 'completed';
    const isRunning = job?.status === 'running';
    const isResfinderCompleted = analysisJobs.resfinder?.status === 'completed';
    const showPhastestButton = type !== 'phastest' || isResfinderCompleted;
    const isStopped = job?.status === 'stopped';
    const hasError = job?.status === 'failed';

    const cardContent = () => {
      // Initial state: No job has been run or a previous run failed without a specific error to show.
      if (!job || (hasError && !job.error)) {
        return (
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {genomes.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Please fetch genomes first to run analysis
              </Alert>
            ) : type === 'phastest' && !isResfinderCompleted ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Complete ResFinder analysis first to unlock PHASTEST
              </Alert>
            ) : (
              <Typography variant="body2" sx={{ mb: 2, color: 'success.main' }}>
                ✓ Ready to analyze {genomes.length} genomes
              </Typography>
            )}
            {showPhastestButton && (
              <Button
                fullWidth
                variant="contained"
                onClick={() => handleRunAnalysis(type)}
                disabled={loading || genomes.length === 0}
                startIcon={<PlayIcon />}
                sx={{ mt: 'auto' }}
              >
                Start Analysis
              </Button>
            )}
          </div>
        );
      }

      // Active state: Job is running, completed, stopped, or failed with an error.
      return (
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Chip label={job.status} color={getStatusColor(job.status)} size="small" />
            {isRunning && <CircularProgress size={16} />}
          </div>

          {hasError && job.error && (
            <Alert severity="error" sx={{ fontSize: '0.875rem' }}>{job.error}</Alert>
          )}
          {hasError && type === 'phastest' && job.result?.fallback_zip_path && (
            <>
              <Alert severity="info" sx={{ fontSize: '0.875rem', mb: 1 }}>
                You can download the FASTA files and submit them manually to phastest.ca
              </Alert>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => {
                    if (job.job_id) {
                      handleDownloadFallbackZip(job.job_id);
                    }
                  }}
                startIcon={<DownloadIcon />}
                sx={{ mt: 1 }}
              >
                Download Zipped FASTA
              </Button>
            </>
          )}

          <div style={{ marginTop: 'auto', display: 'flex', gap: 1, width: '100%' }}>
            {isCompleted && (
              <Button fullWidth variant="contained" onClick={() => handleDownload(type, job.job_id)} startIcon={<DownloadIcon />}>
                Download Results
              </Button>
            )}
            {isRunning && (
              <Button fullWidth variant="outlined" color="error" size="small" onClick={() => setConfirmDialog({ open: true, jobId: job.job_id, action: 'stop', type })} startIcon={<StopIcon />}>
                Stop
              </Button>
            )}
            {(isStopped || hasError) && (
              <Button fullWidth variant="outlined" size="small" onClick={() => handleRunAnalysis(type)} startIcon={<PlayIcon />}>
                Retry
              </Button>
            )}
          </div>
          {!isCompleted && (
             <Tooltip title="Refresh Status">
                <IconButton onClick={() => handleRefreshStatus(job.job_id, type)} size="small" sx={{ position: 'absolute', top: 8, right: 8 }}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
          )}
        </div>
      );
    };

    return (
      <Grid item xs={12} md={4} key={type}>
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
              {getAnalysisIcon(type)}
              <Typography variant="h6" sx={{ ml: 1 }}>{getAnalysisTitle(type)}</Typography>
            </div>
            {cardContent()}
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <div style={{ padding: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Genome Analysis Dashboard
      </Typography>

      

      {/* BioProject Input Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Fetch Genomes
          </Typography>
          <div style={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 300 }}>
              <input
                type="text"
                placeholder="BioProject ID e.g., PRJNA123456"
                value={bioprojectId}
                onChange={(e) => setBioprojectId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  borderColor: '#1976d2'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleFetchGenomes();
                  }
                }}
              />
            </div>
              <Button
                variant="contained"
                onClick={handleFetchGenomes}
              disabled={fetchingGenomes || !bioprojectId.trim()}
              startIcon={fetchingGenomes ? <CircularProgress size={20} /> : <RefreshIcon />}
                sx={{
                  py: 1.5,
                  px: 3,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
                    transform: 'translateY(-1px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                    boxShadow: '0 1px 4px rgba(25, 118, 210, 0.3)',
                  },
                  '&:disabled': {
                    opacity: 0.6,
                    transform: 'none',
                    boxShadow: 'none',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
              {fetchingGenomes ? 'Fetching...' : 'Fetch Genomes'}
              </Button>
          </div>
          {genomes.length > 0 && (
            <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ color: 'success.main' }}>
                ✓ {genomes.length} genomes loaded and ready for analysis
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setGenomes([]);
                  setSnackbar({
                    open: true,
                    message: 'Genomes cleared',
                    severity: 'info'
                  });
                }}
                sx={{ fontSize: '0.75rem' }}
              >
                Clear Genomes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Cards */}
      <Grid container spacing={3}>
        {renderAnalysisCard('resfinder', analysisJobs.resfinder)}
        {renderAnalysisCard('phastest', analysisJobs.phastest)}
        {renderAnalysisCard('vfdb', analysisJobs.vfdb)}
      </Grid>

      {/* Genome Table Section */}
      {genomes.length > 0 && (
        <Card sx={{ mb: 3, mt: 3 }}>
          <CardContent>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <Typography variant="h6">
                Fetched Genomes ({genomes.length})
            </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setGenomes([]);
                  setSnackbar({
                    open: true,
                    message: 'Genomes cleared',
                    severity: 'info'
                  });
                }}
                sx={{ fontSize: '0.75rem' }}
              >
                Clear All
              </Button>
            </div>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Accession</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Organism</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Assembly Level</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Genome Size</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Contigs</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Submitter</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {genomes.map((genome, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {genome.assembly_accession}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {genome.organism}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {genome.genus} {genome.species}
                          </Typography>
                        </div>
                      </TableCell>
                      <TableCell>
                            <Chip
                          label={genome.assembly_level} 
                              size="small"
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {parseInt(genome.genome_size).toLocaleString()} bp
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {parseInt(genome.contig_count).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          {genome.submitter}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* PHASTEST Fallback Section */}
      {phastestZipFiles.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <Typography variant="h6">
                PHASTEST Results Available ({phastestZipFiles.length})
              </Typography>
              <Button
                variant="contained"
                onClick={handleDownloadPhastestZip}
                startIcon={<DownloadIcon />}
                disabled={loadingZipFiles}
                sx={{
                  py: 1.5,
                  px: 3,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
                    transform: 'translateY(-1px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                    boxShadow: '0 1px 4px rgba(25, 118, 210, 0.3)',
                  },
                  '&:disabled': {
                    opacity: 0.6,
                    transform: 'none',
                    boxShadow: 'none',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                Download All Results
              </Button>
            </div>
            <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Filename</TableCell>
                    <TableCell align="right">Size (MB)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {phastestZipFiles.map((file: { filename: string; size_mb: number }, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{file.filename}</TableCell>
                      <TableCell align="right">{file.size_mb}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          Are you sure you want to {confirmDialog.action} the {confirmDialog.type} analysis?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
            Cancel
              </Button>
                        <Button
            onClick={() => {
              if (confirmDialog.action === 'stop') {
                handleStopJob(confirmDialog.jobId, confirmDialog.type);
              }
              setConfirmDialog({ ...confirmDialog, open: false });
            }}
            color="error"
            variant="contained"
          >
            {confirmDialog.action === 'stop' ? 'Stop' : 'Confirm'}
                        </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Dashboard;