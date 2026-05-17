from groq import Groq
from config import settings
import json
import os

class AIEngine:
    def __init__(self):
        try:
            self.client = Groq(api_key=settings.groq_api_key)
        except Exception:
            self.client = None

    def _call_ai(self, prompt: str, system_prompt: str) -> str:
        if not self.client:
            return "AI Enrichment Disabled (No API Key)"
        
        try:
            full_prompt = f"System Instructions: {system_prompt}\n\nTask: {prompt}"
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": full_prompt}],
                temperature=0.7,
                max_tokens=400
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"AI Error: {str(e)}"

    def enrich_breaking(self, article: dict) -> str:
        system = "You are a breaking news alert agent. Be concise, punchy, and highlight 'Why it matters'."
        prompt = f"Headline: {article['headline']}\nSummary: {article.get('summary', '')}"
        return self._call_ai(prompt, system)

    def enrich_digest(self, articles: list) -> str:
        system = "You are an expert news curator. Write a very short plain-text news summary. Use ONLY '• ' as bullet points. DO NOT use any markdown: no ###, no **, no *, no backticks. Each bullet must be 1 sentence max. Include only the top 4-5 most important stories. Be punchy and direct."
        # Keep only the essential parts of the articles to avoid overwhelming the prompt token limit
        condensed_articles = [{"headline": a["headline"], "summary": a.get("summary", "")[:200]} for a in articles]
        prompt = json.dumps(condensed_articles)
        return self._call_ai(prompt, system)

    def handle_dlq(self, error_data: dict) -> str:
        system = "You are a system recovery agent. Explain this error in plain English and suggest a fix."
        prompt = json.dumps(error_data)
        return self._call_ai(prompt, system)
