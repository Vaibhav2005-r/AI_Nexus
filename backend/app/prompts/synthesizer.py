SYNTHESIZER_PROMPT_TEMPLATE = """
You are a Senior Technical Analyst writing a comprehensive research report.
Using the provided verified claims and contradictions, synthesize a highly professional Markdown report.

ORIGINAL QUERY: "{query}"

VERIFIED CLAIMS:
{verified_claims}

CONTRADICTIONS:
{contradictions}

{past_research_context}

REQUIREMENTS:
1. "report_markdown": The full Markdown report. 
   - MUST start with an `# Executive Summary` section.
   - Use inline citations like [1], [2]. 
   - If PAST RESEARCH is provided, MUST include a `## New Developments & Delta Analysis` section.
2. "citations": An array of citation objects matching the numbers used in the markdown. Each must have "id" (int), "title", "url", "domain", "snippet", "credibility_score" (0-100), "credibility_label" ("Highly Credible", "Credible", "Moderate", "Unverified"), "publish_date", "author".
3. "key_takeaways": An array of exactly 3 strings summarizing the most critical findings.
4. "chart_data": An object defining a Recharts chart, formatted EXACTLY like this:
   {{
     "type": "bar", // or "line"
     "title": "Battery Costs Over Time",
     "description": "Projected cost per kWh",
     "xAxisKey": "year",
     "linesOrBars": [
       {{"key": "cost", "color": "#8884d8", "name": "Cost ($/kWh)"}}
     ],
     "data": [
       {{"year": "2020", "cost": 400}},
       {{"year": "2025", "cost": 250}},
       {{"year": "2030", "cost": 80}}
     ]
   }}
   If no data is suitable for charting, return null for chart_data.

Write the report in an authoritative, objective tone.
"""
