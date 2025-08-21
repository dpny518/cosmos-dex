.PHONY: build-contracts deploy-contracts build-frontend run-frontend clean

# Build smart contracts using Docker
build-contracts:
	docker-compose run --rm contract-builder

# Deploy contracts to Cosmos Hub
deploy-contracts:
	docker-compose run --rm deployer ./deploy.sh

# Build frontend
build-frontend:
	docker-compose build frontend

# Run frontend development server
run-frontend:
	docker-compose up frontend

# Generate new deployer keys
generate-keys:
	docker-compose run --rm deployer ./generate-keys.sh

# Clean build artifacts
clean:
	rm -rf artifacts/
	docker system prune -f

# Full setup
setup: build-contracts build-frontend

# Deploy everything
deploy-all: build-contracts deploy-contracts

# Help
help:
	@echo "Available commands:"
	@echo "  build-contracts  - Build CosmWasm contracts"
	@echo "  deploy-contracts - Deploy contracts to Cosmos Hub"
	@echo "  build-frontend   - Build React frontend"
	@echo "  run-frontend     - Run frontend development server"
	@echo "  generate-keys    - Generate new deployer keys"
	@echo "  clean           - Clean build artifacts"
	@echo "  setup           - Build contracts and frontend"
	@echo "  deploy-all      - Build and deploy contracts"