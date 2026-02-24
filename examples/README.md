# Example YAML Definitions

These examples demonstrate all six YAML schema types using an alert management domain.

## Entities

- **alert-channel.entity.yaml** — delivery channel (Slack, email, webhook, SMS) with CRUD + timestamps
- **alert-event.entity.yaml** — the alert itself with severity levels and metadata

## Functions

- **dispatch-alert.function.yaml** — core dispatch logic: find channels, filter by severity, send alerts
- **process-alert-batch.function.yaml** — batch processing: filter non-info alerts, dispatch each with error handling

## Commands

- **alerts-setup.command.yaml** — CLI command to configure an alert channel with args and options

## Routes

- **alert-channels.route.yaml** — REST API with GET/POST/DELETE operations mapped to functions

## Providers

- **slack.provider.yaml** — Slack webhook provider with JSON template rendering

## Clients

- **openai.client.yaml** — typed HTTP client for OpenAI API with bearer auth, retry, and timeout

## Usage

```bash
cd compiler
npx flusk-lang validate    # validate all YAML schemas
npx flusk-lang build       # generate Node.js + Python code
```
