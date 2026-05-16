# Newron AI News Platform

Newron is a real-time event-driven AI news pipeline. It scrapes RSS feeds, classifies news as breaking/general, uses Google's Gemini AI to summarize articles by topic, and delivers markdown briefings directly to Telegram.

## Architecture

* **Backend**: FastAPI (Python)
* **Frontend**: React (Vite, TypeScript)
* **Message Broker**: Kafka
* **Database**: PostgreSQL
* **Caching/Deduplication**: Redis

## Prerequisites

* Docker and Docker Compose
* Node.js (v18+)
* Python (3.10+)
* A Telegram Bot Token (from BotFather)
* A Google Gemini API Key

## Setup

1. **Environment Variables**: 
   Copy `.env.example` to `.env` in the root directory and fill in your Gemini and Telegram API keys.

2. **Python Environment**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Node Environment**:
   ```bash
   cd frontend
   npm install
   ```

## Running the Application (Using Makefile)

We have provided a `Makefile` to easily start all components. 

1. **Start Infrastructure (Kafka, Postgres, Redis)**:
   ```bash
   make infra
   ```

2. **Start the Background Consumers**:
   *(This starts the Classifier, AI, and Notification consumers in the background)*
   ```bash
   make consumers
   ```

3. **Start the Backend API**:
   *(In a new terminal window)*
   ```bash
   make backend
   ```

4. **Start the Frontend Dashboard**:
   *(In a new terminal window)*
   ```bash
   make frontend
   ```

## Stopping the Application

To shut everything down and stop the background consumer processes:
```bash
make stop-all
```
