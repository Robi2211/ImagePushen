COMPOSE_FILE := docker-compose/docker-compose.yml

# Detect whether to use 'docker compose' (plugin) or 'docker-compose' (standalone)
DOCKER_COMPOSE := $(shell docker compose version >/dev/null 2>&1 && echo "docker compose" || echo "docker-compose")

.PHONY: help start stop build logs clean

help: ## Diese Hilfe anzeigen
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

start: ## Alle Services starten (baut Image automatisch, falls nötig)
	@if [ ! -f docker-compose/.env ]; then \
		cp docker-compose/.env.example docker-compose/.env; \
		echo "INFO: docker-compose/.env aus .env.example erstellt – Standardpasswörter werden verwendet."; \
	fi
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) up -d --build

stop: ## Alle Services stoppen (Daten bleiben erhalten)
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) down

build: ## Image neu bauen
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) build

logs: ## Logs aller Services anzeigen (CTRL+C zum Beenden)
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) logs -f

clean: ## Services stoppen UND Volumes löschen (alle Daten werden gelöscht!)
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) down -v
