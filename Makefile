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
	@mkdir -p scratch
	@cd backend && PYTHONUNBUFFERED=1 nohup ../venv/bin/python -m kafka.consumers.classifier_consumer > ../scratch/classifier.log 2>&1 &
	@cd backend && PYTHONUNBUFFERED=1 nohup ../venv/bin/python -m kafka.consumers.ai_consumer > ../scratch/ai.log 2>&1 &
	@cd backend && PYTHONUNBUFFERED=1 nohup ../venv/bin/python -m kafka.consumers.notification_consumer > ../scratch/notification.log 2>&1 &
	@echo "Consumers started successfully. Logs are available in the 'scratch/' directory."

# Stop all background Kafka consumers
stop-consumers:
	@echo "Stopping all python consumer processes..."
	pkill -f "python -m kafka.consumers" || true
	@echo "Consumers stopped."

# Start everything in the background
start-all: infra
	@echo "Starting backend in background..."
	@bash -c 'cd backend && PYTHONUNBUFFERED=1 nohup ../venv/bin/uvicorn main:app --reload > ../scratch/backend.log 2>&1 &'
	@echo "Waiting for backend to be ready..."
	@sleep 8
	@echo "Provisioning Kafka topics..."
	@curl -s -X POST http://localhost:8000/kafka/setup > /dev/null && echo "Kafka topics provisioned." || echo "Warning: Could not provision Kafka topics."
	@echo "Starting consumers in the background..."
	@mkdir -p scratch
	@cd backend && PYTHONUNBUFFERED=1 nohup ../venv/bin/python -m kafka.consumers.classifier_consumer > ../scratch/classifier.log 2>&1 &
	@cd backend && PYTHONUNBUFFERED=1 nohup ../venv/bin/python -m kafka.consumers.ai_consumer > ../scratch/ai.log 2>&1 &
	@cd backend && PYTHONUNBUFFERED=1 nohup ../venv/bin/python -m kafka.consumers.notification_consumer > ../scratch/notification.log 2>&1 &
	@echo "Starting frontend in background..."
	@bash -c 'cd frontend && nohup npm run dev > ../scratch/frontend.log 2>&1 &'
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
