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

# Start infra and consumers automatically
run-all: infra consumers
	@echo "Infrastructure and Consumers are running."
	@echo "Next steps: Run 'make backend' and 'make frontend' in separate terminals."

# Stop everything
stop-all: stop-consumers stop-infra
	@echo "Everything has been shut down."
