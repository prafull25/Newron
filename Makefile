.PHONY: infra stop-infra backend frontend consumers stop-consumers run-all stop-all

# Start docker-compose infrastructure (Kafka, Postgres, Redis, Clickhouse)
infra:
	docker-compose up -d

# Stop docker-compose infrastructure
stop-infra:
	docker-compose down

# Run the FastAPI backend server (ensure you have activated your venv)
backend:
	cd backend && uvicorn main:app --reload

# Run the React frontend
frontend:
	cd frontend && npm run dev

# Start all Kafka consumers in the background
consumers:
	@echo "Starting consumers in the background..."
	@cd backend && export PYTHONPATH=. && export PYTHONUNBUFFERED=1 && \
	nohup python -m kafka.consumers.classifier_consumer > ../scratch/classifier.log 2>&1 & \
	nohup python -m kafka.consumers.ai_consumer > ../scratch/ai.log 2>&1 & \
	nohup python -m kafka.consumers.notification_consumer > ../scratch/notification.log 2>&1 &
	@echo "Consumers started successfully. Logs are available in the 'scratch/' directory."

# Stop all background Kafka consumers
stop-consumers:
	@echo "Stopping all python consumer processes..."
	pkill -f "python -m kafka.consumers" || true
	@echo "Consumers stopped."

# Start everything in the background
start-all: infra consumers
	@echo "Starting backend in background..."
	@cd backend && nohup uvicorn main:app --reload > ../scratch/backend.log 2>&1 &
	@echo "Starting frontend in background..."
	@cd frontend && nohup npm run dev > ../scratch/frontend.log 2>&1 &
	@echo "All services started successfully!"
	@echo "Frontend Dashboard: http://localhost:3000"
	@echo "Backend API Docs: http://localhost:8000/docs"
	@echo "Logs are available in the 'scratch/' directory."

# Stop everything
stop-all: stop-consumers stop-infra
	@echo "Stopping backend..."
	@pkill -f "uvicorn main:app" || true
	@echo "Stopping frontend..."
	@pkill -f "vite" || true
	@echo "Everything has been shut down."
