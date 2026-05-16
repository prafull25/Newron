from google import genai
from config import settings
import json
import os

class AIEngine:
    def __init__(self):
        self.api_key = settings.gemini_api_key
        if self.api_key and self.api_key != "your_gemini_key_here":
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None

    def _call_gemini(self, prompt: str, system_prompt: str) -> str:
        if not self.client:
            return "AI Enrichment Disabled (No API Key)"
        
        try:
            full_prompt = f"System Instructions: {system_prompt}\n\nTask: {prompt}"
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=full_prompt,
            )
            return response.text
        except Exception as e:
            return f"AI Error: {str(e)}"

    def enrich_breaking(self, article: dict) -> str:
        system = "You are a breaking news alert agent. Be concise, punchy, and highlight 'Why it matters'."
        prompt = f"Headline: {article['headline']}\nSummary: {article.get('summary', '')}"
        return self._call_gemini(prompt, system)

    def enrich_digest(self, articles: list) -> str:
        system = "You are an expert news curator. You have received a batch of news articles. Create a single, beautifully formatted markdown briefing summarizing the most important trends and stories from this batch. Use bullet points and group similar stories."
        # Keep only the essential parts of the articles to avoid overwhelming the prompt token limit
        condensed_articles = [{"headline": a["headline"], "summary": a.get("summary", "")[:200]} for a in articles]
        prompt = json.dumps(condensed_articles)
        return self._call_gemini(prompt, system)

    def handle_dlq(self, error_data: dict) -> str:
        system = "You are a system recovery agent. Explain this error in plain English and suggest a fix."
        prompt = json.dumps(error_data)
        return self._call_gemini(prompt, system)
