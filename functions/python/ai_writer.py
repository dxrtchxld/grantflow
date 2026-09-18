# ai_writer.py — Mistral-powered proposal generation + budget + match scoring
import os
import json
from typing import Dict, List, Optional

TEMPLATES = {
    "default": {
        "name": "Standard Grant Proposal",
        "sections": [
            "Executive Summary",
            "Organization Background",
            "Problem Statement",
            "Project Description",
            "Budget Narrative",
            "Evaluation Plan",
        ],
    },
    "nonprofit": {
        "name": "Nonprofit Grant Proposal",
        "sections": [
            "Mission Statement",
            "Community Impact",
            "Project Description",
            "Funding Request",
            "Sustainability Plan",
        ],
    },
    "education": {
        "name": "Education Grant Proposal",
        "sections": [
            "Project Overview",
            "Educational Goals",
            "Target Audience",
            "Curriculum Plan",
            "Assessment Methods",
            "Budget Narrative",
        ],
    },
    "research": {
        "name": "Research Grant Proposal",
        "sections": [
            "Abstract",
            "Background and Significance",
            "Research Design and Methods",
            "Expected Outcomes",
            "Dissemination Plan",
            "Budget Narrative",
        ],
    },
    "small_business": {
        "name": "Small Business Grant Proposal",
        "sections": [
            "Executive Summary",
            "Business Overview",
            "Market Opportunity",
            "Use of Funds",
            "Growth Plan",
            "Financial Projections",
        ],
    },
}


def _call_mistral(messages: List[Dict], model: str = "mistral-large-latest", temperature: float = 0.7, json_mode: bool = False) -> str:
    """Call Mistral AI chat completions API."""
    import requests
    api_key = os.environ.get("MISTRAL_API_KEY", "")
    if not api_key:
        return "[AI generation unavailable — MISTRAL_API_KEY not configured]"

    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": 1500,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    try:
        resp = requests.post(
            "https://api.mistral.ai/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=payload,
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]
    except Exception as e:
        return f"[AI error: {str(e)}]"


def generate_section(section_name: str, grant: Dict, requirements: str, org_context: Dict, template_id: str = "default") -> str:
    """Generate a single proposal section using Mistral."""
    grant_title = grant.get("name", "this grant opportunity")
    org_name = org_context.get("businessName", "our organization")
    org_state = org_context.get("state", "")
    industry = org_context.get("industry", "")

    prompt = f"""Write a professional, compelling '{section_name}' section for a grant proposal.

Grant: {grant_title}
Grant Agency: {grant.get('agency', 'grant funder')}
Funding Amount: ${grant.get('amount', 'unspecified'):,}

Applicant Organization: {org_name}
State: {org_state}
Industry: {industry}
Project Requirements / Notes: {requirements}

Write approximately 200-300 words. Be specific, persuasive, and professional. Use concrete language. Do not use placeholder text like [YOUR NAME] — write as if this is a real proposal."""

    return _call_mistral([
        {"role": "system", "content": "You are an expert grant writer with 20 years of experience winning federal, state, and private foundation grants. Write compelling, specific, and professional grant proposal sections."},
        {"role": "user", "content": prompt},
    ])


def generate_full_proposal(grant: Dict, requirements: str, org_context: Dict, template_id: str = "default") -> Dict:
    """Generate all sections of a proposal for a given template."""
    template = TEMPLATES.get(template_id, TEMPLATES["default"])
    sections = {}
    for section in template["sections"]:
        sections[section] = generate_section(section, grant, requirements, org_context, template_id)
    return {
        "templateId": template_id,
        "templateName": template["name"],
        "sections": sections,
        "grantId": grant.get("id", ""),
        "grantName": grant.get("name", ""),
    }


def generate_budget(requirements: str, total_hint: Optional[float] = None) -> Dict:
    """Generate a structured budget table from text requirements."""
    hint_text = f" The total budget should be approximately ${total_hint:,.0f}." if total_hint else ""
    prompt = f"""Create a detailed grant budget for this project:{hint_text}

{requirements}

Return a JSON object with exactly this structure:
{{
  "line_items": [
    {{"category": "Personnel", "description": "...", "amount": 0.0}},
    ...
  ],
  "total": 0.0,
  "notes": "Budget narrative summary"
}}

Include 5-8 realistic line items covering Personnel, Equipment/Supplies, Travel, Indirect Costs, and any project-specific costs. Amounts should be realistic and sum to 'total'."""

    raw = _call_mistral(
        [{"role": "user", "content": prompt}],
        model="mistral-large-latest",
        temperature=0.2,
        json_mode=True,
    )
    try:
        result = json.loads(raw)
        # Recalculate total from line items to ensure accuracy
        if "line_items" in result:
            result["total"] = sum(item.get("amount", 0) for item in result["line_items"])
        return result
    except (json.JSONDecodeError, TypeError):
        return {"line_items": [], "total": 0.0, "notes": raw[:200]}


def score_match(org_profile: Dict, grant: Dict) -> Dict:
    """Score 0-100 how well an org matches a grant opportunity."""
    prompt = f"""Score how well this organization matches this grant opportunity.

Organization:
- Name: {org_profile.get('businessName', 'Unknown')}
- State: {org_profile.get('state', '')}
- Industry: {org_profile.get('industry', '')}
- Entity Type: {org_profile.get('entityType', '')}
- Description: {org_profile.get('description', 'Small business')}

Grant:
- Title: {grant.get('name', '')}
- Agency: {grant.get('agency', '')}
- Description: {grant.get('description', '')[:300]}
- Eligibility: {', '.join(grant.get('eligibility', []))}
- Category: {grant.get('category', '')}

Return JSON: {{"score": <integer 0-100>, "reasoning": "<2 sentence explanation>", "strengths": ["..."], "gaps": ["..."]}}"""

    raw = _call_mistral(
        [{"role": "user", "content": prompt}],
        model="mistral-small-latest",
        temperature=0.1,
        json_mode=True,
    )
    try:
        return json.loads(raw)
    except:
        return {"score": 50, "reasoning": "Could not compute score.", "strengths": [], "gaps": []}


def refine_section(section_text: str, feedback: str, section_name: str) -> str:
    """Refine an existing section based on user feedback."""
    prompt = f"""Improve this '{section_name}' grant proposal section based on the feedback:

Current section:
{section_text}

Feedback / requested changes:
{feedback}

Return only the improved section text, no commentary."""
    return _call_mistral([{"role": "user", "content": prompt}])
