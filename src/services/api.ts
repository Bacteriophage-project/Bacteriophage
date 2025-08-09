import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://ninety-jars-flow.loca.lt/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface JobStatus {
  job_id: string;
  job_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  result: any;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface GenomeData {
  url: string;
  genus: string;
  species: string;
  strain: string;
  organism: string;
  assembly_accession: string;
  assembly_name: string;
  assembly_level: string;
  taxonomy_id: string;
  submitter: string;
  submission_date: string;
  contig_count: string;
  genome_size: string;
  bioproject_id: string;
}

export interface FetchGenomesResponse {
  job_id: string;
  message: string;
  status: string;
}

export interface AnalysisResponse {
  job_id: string;
  message: string;
  status: string;
  error?: string;
  fallback_zip_path?: string;
}

// API functions
export const apiService = {
  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Fetch genomes from NCBI
  fetchGenomes: async (bioprojectId: string): Promise<FetchGenomesResponse> => {
    const response = await api.post('/fetch-genomes', { bioproject_id: bioprojectId });
    return response.data;
  },

  // Run ResFinder analysis
  runResFinder: async (genomeUrls: GenomeData[]): Promise<AnalysisResponse> => {
    const response = await api.post('/run-resfinder', { genome_urls: genomeUrls });
    return response.data;
  },

  // Run PHASTEST analysis
  runPhastest: async (genomeUrls: GenomeData[]): Promise<AnalysisResponse> => {
    const response = await api.post('/run-phastest', { genome_urls: genomeUrls });
    return response.data;
  },

  // Run VFDB analysis
  runVfdb: async (genomeUrls: GenomeData[]): Promise<AnalysisResponse> => {
    const response = await api.post('/run-vfdb', { genome_urls: genomeUrls });
    return response.data;
  },

  // Get job status
  getJobStatus: async (jobId: string): Promise<JobStatus> => {
    const response = await api.get(`/job-status/${jobId}`);
    return response.data;
  },

  // List all jobs
  listJobs: async (): Promise<{ jobs: JobStatus[] }> => {
    const response = await api.get('/jobs');
    return response.data;
  },

  // Download file
  downloadFile: async (jobId: string, fileType: string): Promise<Blob> => {
    const response = await api.get(`/download/${jobId}/${fileType}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Check PHASTEST API status
  checkPhastestStatus: async (): Promise<{ status: string; status_code?: number; error?: string }> => {
    const response = await api.get('/phastest-status');
    return response.data;
  },

  // List PHASTEST zip files
  listPhastestZipFiles: async (): Promise<{ zip_files: Array<{ filename: string; size: number; size_mb: number }> }> => {
    const response = await api.get('/phastest-zip-files');
    return response.data;
  },

  // Download PHASTEST zip files
  downloadPhastestZip: async (): Promise<Blob> => {
    const response = await api.get('/phastest-zip-files', {
      responseType: 'blob',
    });
    return response.data;
  },

  // List temporary FASTA zip files
  listTempFastaZipFiles: async (): Promise<{ zip_files: Array<{ 
    filename: string; 
    temp_dir: string; 
    full_path: string; 
    size: number; 
    size_mb: number; 
    created_time: number 
  }> }> => {
    const response = await api.get('/temp-fasta-zip-files');
    return response.data;
  },

  // Download a specific temporary FASTA zip file
  downloadTempFastaZip: async (tempDir: string, filename: string): Promise<Blob> => {
    const response = await api.get(`/download-temp-fasta-zip/${tempDir}/${filename}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Download FASTA files from ResFinder results as zip
  downloadResfinderFastaZip: async (): Promise<Blob> => {
    console.log('API: Starting downloadResfinderFastaZip request...');
    try {
      const response = await api.get('/download-resfinder-fasta-zip', {
        responseType: 'blob',
        timeout: 120000, // 2 minutes timeout for large file download
      });
      console.log('API: downloadResfinderFastaZip response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        dataSize: response.data?.size
      });
      return response.data;
    } catch (error) {
      console.error('API: downloadResfinderFastaZip error:', error);
      throw error;
    }
  },

  // Download FASTA files for manual PHASTEST submission
  downloadFastaFiles: async (genomeUrls: GenomeData[]): Promise<Blob> => {
    console.log('API: Starting FASTA download for', genomeUrls.length, 'genomes');
    const response = await api.post('/download-fasta-files', { genome_urls: genomeUrls }, {
      responseType: 'blob',
    });
    console.log('API: Received response:', response.status, response.headers);
    console.log('API: Blob size:', response.data.size);
    return response.data;
  },

  // Cleanup job
  cleanupJob: async (jobId: string): Promise<void> => {
    await api.delete(`/cleanup/${jobId}`);
  },

  // Manual cleanup files
  cleanupFiles: async (): Promise<{ message: string; status: string }> => {
    const response = await api.post('/cleanup-files');
    return response.data;
  },

  // Stop job (placeholder)
  stopJob: async (jobId: string): Promise<void> => {
    // TODO: Implement stop job endpoint
    console.log('Stop job not implemented yet');
  },

  // Resume job (placeholder)
  resumeJob: async (jobId: string) => {
    console.log('Resume job not implemented yet');
  },

  // Check if result files exist for a job
  checkFiles: async (jobId: string): Promise<any> => {
    const response = await api.get(`/check-files/${jobId}`);
    return response.data;
  },

  // Control job execution (stop/resume)
  controlJob: async (jobId: string, action: 'stop' | 'resume'): Promise<any> => {
    const response = await api.post(`/job-control/${jobId}/${action}`);
    return response.data;
  },

  // Check network status
  checkNetworkStatus: async (): Promise<any> => {
    const response = await api.get('/network-status');
    return response.data;
  },

  // Generic run analysis method
  runAnalysis: async (type: 'resfinder' | 'phastest' | 'vfdb', genomeUrls: GenomeData[] = []): Promise<AnalysisResponse> => {
    const response = await api.post(`/run-${type}, { genome_urls: genomeUrls }`);
    return response.data;
  }
};

export default apiService;