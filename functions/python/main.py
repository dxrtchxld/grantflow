# main.py — FastAPI backend served as Firebase Cloud Function
# Handles grant search, AI proposal generation, budget generation, match scoring
import os
import json
from typing import Optional, List
from datetime import datetime

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, firestore as fs

import functions_framework

# Initialize Firebase Admin (only once)
if not firebase_admin._apps:
    firebase_admin.initialize_app()

db = fs.client()

from scraper import search_all
from ai_writer import (
    generate_full_proposal,
    generate_section,
    generate_budget,
    score_match,
    refine_section,
    TEMPLATES,
)

app = FastAPI(title="GrantFlow API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic Models ──────────────────────────────────────────────────────────

class GrantSearchRequest(BaseModel):
    keywords: str
    location: Optional[str] = None
    max_funding: Optional[float] = None
    deadline_after: Optional[str] = None
    org_profile: Optional[dict] = None  # for match scoring


class ProposalGenerateRequest(BaseModel):
    grant: dict
    requirements: str
    template_id: str = "default"
    org_context: dict = {}


class SectionGenerateRequest(BaseModel):
    section_name: str
    grant: dict
    requirements: str
    org_context: dict = {}


class SectionRefineRequest(BaseModel):
    section_text: str
    feedback: str
    section_name: str


class BudgetRequest(BaseModel):
    requirements: str
    total_hint: Optional[float] = None


class MatchScoreRequest(BaseModel):
    org_profile: dict
    grant: dict


class SaveProposalRequest(BaseModel):
    user_id: str
    grant_id: str
    grant_name: str
    sections: dict
    budget: Optional[dict] = None
    template_id: str = "default"
    status: str = "draft"


# ── Health ───────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "version": "2.0.0"}


# ── Grant Search ─────────────────────────────────────────────────────────────

@app.post("/api/grants/search")
def search_grants(req: GrantSearchRequest):
    grants = search_all(
        keywords=req.keywords,
        location=req.location,
        max_funding=req.max_funding,
        deadline_after=req.deadline_after,
    )
    # Score each grant if org_profile provided
    if req.org_profile and grants:
        for grant in grants[:10]:  # Score top 10 to save API calls
            try:
                score_data = score_match(req.org_profile, grant)
                grant["matchScore"] = score_data.get("score", None)
                grant["matchReasoning"] = score_data.get("reasoning", "")
            except:
                grant["matchScore"] = None
    return {"grants": grants, "total": len(grants)}


# ── Firestore grant lookup ───────────────────────────────────────────────────

@app.get("/api/grants/{grant_id}")
def get_grant(grant_id: str):
    doc = db.collection("grants").document(grant_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Grant not found")
    return {"id": doc.id, **doc.to_dict()}


# ── Proposal Generation ──────────────────────────────────────────────────────

@app.post("/api/proposals/generate")
def generate_proposal(req: ProposalGenerateRequest):
    proposal = generate_full_proposal(
        grant=req.grant,
        requirements=req.requirements,
        org_context=req.org_context,
        template_id=req.template_id,
    )
    return {"proposal": proposal}


@app.post("/api/proposals/section")
def generate_proposal_section(req: SectionGenerateRequest):
    content = generate_section(
        section_name=req.section_name,
        grant=req.grant,
        requirements=req.requirements,
        org_context=req.org_context,
    )
    return {"content": content, "section": req.section_name}


@app.post("/api/proposals/refine")
def refine_proposal_section(req: SectionRefineRequest):
    content = refine_section(
        section_text=req.section_text,
        feedback=req.feedback,
        section_name=req.section_name,
    )
    return {"content": content, "section": req.section_name}


@app.post("/api/proposals/save")
def save_proposal(req: SaveProposalRequest):
    doc_ref = db.collection("proposals").document()
    data = {
        "userId": req.user_id,
        "grantId": req.grant_id,
        "grantName": req.grant_name,
        "sections": req.sections,
        "budget": req.budget,
        "templateId": req.template_id,
        "status": req.status,
        "createdAt": fs.SERVER_TIMESTAMP,
        "updatedAt": fs.SERVER_TIMESTAMP,
    }
    doc_ref.set(data)
    return {"proposalId": doc_ref.id, "status": "saved"}


# ── Budget Generation ────────────────────────────────────────────────────────

@app.post("/api/budget/generate")
def generate_budget_endpoint(req: BudgetRequest):
    budget = generate_budget(req.requirements, req.total_hint)
    return {"budget": budget}


# ── Match Scoring ────────────────────────────────────────────────────────────

@app.post("/api/grants/score")
def score_grant_match(req: MatchScoreRequest):
    result = score_match(req.org_profile, req.grant)
    return result


# ── Templates ─────────────────────────────────────────────────────────────────

@app.get("/api/templates")
def get_templates():
    return {"templates": [
        {"id": tid, "name": t["name"], "sections": t["sections"]}
        for tid, t in TEMPLATES.items()
    ]}


# ── Firebase Function entrypoint ─────────────────────────────────────────────

@functions_framework.http
def grantflow_api(request):
    """Firebase Cloud Function HTTP entrypoint wrapping FastAPI."""
    from io import BytesIO
    scope = {
        "type": "http",
        "method": request.method,
        "path": request.path,
        "query_string": request.query_string,
        "headers": [(k.lower().encode(), v.encode()) for k, v in request.headers.items()],
    }

    import asyncio
    from starlette.testclient import TestClient
    client = TestClient(app)
    
    # Forward the request to FastAPI
    method = request.method.lower()
    url = request.path
    if request.query_string:
        url += f"?{request.query_string.decode()}"
    
    body = request.get_data()
    headers = dict(request.headers)
    
    response = getattr(client, method)(url, data=body, headers=headers)
    
    from flask import Response
    return Response(
        response.text,
        status=response.status_code,
        headers=dict(response.headers),
        mimetype=response.headers.get("content-type", "application/json"),
    )
