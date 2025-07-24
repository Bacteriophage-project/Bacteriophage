import os
import time
import requests
from fastapi import FastAPI, HTTPException, Query, Body
from typing import List, Dict, Any
from fetch_genomes import get_assembly_summaries, process_assembly, fetch_nucleotide_records
from parse_genome import parse_resfinder_results_from_api

app = FastAPI(
    title="Bacteriophage AI for Bacterial Genome Analysis",
    description="API backend for genome fetching and ResFinder analysis via external API",
    version="1.0.0"
)

def serialize_genome(genome: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepare genome dict for JSON response.
    """
    return genome

# Replace these URLs with your actual external ResFinder API endpoints
RESFINDER_API_UPLOAD_URL = "https://resfinder.example.com/api/upload"
RESFINDER_API_STATUS_URL = "https://resfinder.example.com/api/status"
RESFINDER_API_RESULT_URL = "https://resfinder.example.com/api/result"

def upload_fasta_to_resfinder(fasta_path: str) -> str:
    """
    Upload FASTA file to external ResFinder API and return job_id.
    """
    with open(fasta_path, 'rb') as fasta_file:
        files = {'file': fasta_file}
        response = requests.post(RESFINDER_API_UPLOAD_URL, files=files)
        response.raise_for_status()
        data = response.json()
    job_id = data.get("job_id")
    if not job_id:
        raise RuntimeError("No job_id returned from ResFinder API")
    return job_id

def poll_resfinder_job(job_id: str, timeout_sec=300, poll_interval=5) -> dict:
    """
    Poll ResFinder API for job status until completion or timeout.
    """
    status_url = f"{RESFINDER_API_STATUS_URL}/{job_id}"
    result_url = f"{RESFINDER_API_RESULT_URL}/{job_id}"

    start_time = time.time()
    while True:
        response = requests.get(status_url)
        response.raise_for_status()
        status_data = response.json()
        status = status_data.get("status")
        if status == "completed":
            result_resp = requests.get(result_url)
            result_resp.raise_for_status()
            return result_resp.json()
        elif status == "failed":
            raise RuntimeError("ResFinder job failed")
        elif time.time() - start_time > timeout_sec:
            raise RuntimeError("ResFinder job timed out")
        time.sleep(poll_interval)

@app.get("/")
def root():
    return {"message": "FastAPI backend is running!"}

@app.get("/assemblies")
def assemblies(bioproject_id: str = Query(..., description="BioProject ID to fetch assemblies for")):
    summaries = get_assembly_summaries(bioproject_id)
    if not summaries:
        raise HTTPException(status_code=404, detail="No assemblies found.")

    results = []
    for summary in summaries:
        assembly = process_assembly(summary)
        if 'error' in assembly:
            continue
        genomes_serialized = [serialize_genome(g) for g in assembly.get('genomes', [])]
        results.append({
            "assembly_accession": assembly.get('assembly_accession'),
            "organism": assembly.get('organism'),
            "genomes": genomes_serialized,
            "ftp_path": assembly.get('ftp_path')
        })
    return results

@app.get("/nucleotide_genomes")
def nucleotide_genomes(bioproject_id: str = Query(..., description="BioProject ID to fetch nucleotide genomes for")):
    genomes = fetch_nucleotide_records(bioproject_id)
    if not genomes:
        raise HTTPException(status_code=404, detail="No nucleotide genomes found.")
    genomes_serialized = [serialize_genome(g) for g in genomes]
    return genomes_serialized

@app.post("/run_resfinder")
def run_resfinder(genomes: List[Dict[str, Any]] = Body(..., description="List of genomes with 'info.file' for FASTA path")):
    results = []
    for genome in genomes:
        info = genome.get("info", {})
        fasta_path = info.get("file")
        if not fasta_path or not os.path.exists(fasta_path):
            results.append({
                "accession": info.get("accession", "unknown"),
                "error": "FASTA file not found"
            })
            continue

        try:
            job_id = upload_fasta_to_resfinder(fasta_path)
            api_result = poll_resfinder_job(job_id)
            parsed_result = parse_resfinder_results_from_api(api_result)
            results.append({
                "accession": info.get("accession", "unknown"),
                "organism": info.get("organism", "unknown"),
                "resfinder_result": parsed_result
            })
        except Exception as e:
            results.append({
                "accession": info.get("accession", "unknown"),
                "error": str(e)
            })

    return {"results": results}

          
      <p className='ftp'>
        <strong>FTP Path:</strong>{' '}
        {genome.ftp_path ? (
          <a href={genome.ftp_path} target="_blank" rel="noopener noreferrer">Download</a>
        ) : (
          'N/A'
        )}
      </p>