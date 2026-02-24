# Example YAML Definitions

These examples demonstrate all five YAML schema types using an alert management domain.

## Schema Types

### Entity (`*.entity.yaml`)
Defines data models with fields, types, storage backend, and capabilities.
- **alert-channel** — delivery channel (Slack, email, webhook, SMS)
- **alert-event** — the alert itself with severity and metadata

### Function (`*.function.yaml`)
Defines business logic as composable steps. Steps can call other functions, filter, forEach, map, transform, and more. This is the core innovation — logic as YAML, compiled to TypeScript/Python.

### Command (`*.command.yaml`)
Defines CLI commands with arguments, options, and an action that calls a function.

### Route (`*.route.yaml`)
Defines HTTP API routes with CRUD operations that map to functions.

### Provider (`*.provider.yaml`)
Defines external integrations (webhooks, REST, email) with config fields and method templates.

## Usage

Copy examples into `schema/` directories and run:
```bash
cd compiler
npx flusk-lang validate
npx flusk-lang build
```
