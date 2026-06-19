# API Guide

## Authentication
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/profile`
- `PUT /auth/profile`

## AI and Business Modules
- `POST /ai/generate`
- `POST /ai/context-generate`
- `POST /sales/leads`
- `GET /sales/leads`
- `GET /sales/leads/:id`
- `PUT /sales/leads/:id`
- `DELETE /sales/leads/:id`
- `POST /sales/score`
- `POST /sales/followup`
- `POST /marketing/post`
- `POST /marketing/email`
- `POST /marketing/campaign`
- `POST /marketing/adcopy`
- `POST /support/chat`
- `POST /support/tickets`
- `GET /support/tickets`
- `GET /analytics/report`
- `GET /analytics/conversions`

## Context and Knowledge
- `POST /memory/messages`
- `GET /memory/history`
- `GET /memory/history/:sessionId`
- `DELETE /memory/history/:sessionId`
- `POST /memory/session`
- `GET /memory/session`
- `POST /memory/agent`
- `GET /memory/agent/:id`
- `POST /knowledge/upload`
- `GET /knowledge/files`
- `DELETE /knowledge/file`
- `GET /knowledge/search`
- `POST /knowledge/retrieve`
- `POST /prompts`
- `GET /prompts`
- `PUT /prompts/:id`
- `DELETE /prompts/:id`
- `POST /prompts/version`

## Orchestration and Workflow
- `POST /orchestrator/run`
- `GET /orchestrator/runs`
- `GET /orchestrator/runs/:id`
- `GET /orchestrator/stats`
- `GET /orchestrator/notifications`
- `GET /orchestrator/timing`
- `GET /orchestrator/export`
- `POST /workflow`
- `GET /workflow`
- `GET /workflow/:id`
- `PUT /workflow/:id`
- `DELETE /workflow/:id`
- `POST /workflow/run`
- `POST /workflow/trigger`
- `GET /workflow/status`
- `GET /workflow/logs`
- `POST /builder/workflow`
- `GET /builder/workflow`
- `PUT /builder/workflow`
- `DELETE /builder/workflow`
- `POST /builder/run`
- `POST /builder/pause`
- `POST /builder/resume`
- `POST /builder/stop`
- `GET /builder/status`
- `GET /builder/logs`

## Monitoring
- `GET /monitoring/dashboard`
- `GET /monitoring/metrics`
- `GET /monitoring/events`
- `GET /monitoring/feedback`
- `POST /monitoring/metric`
- `POST /monitoring/event`
- `POST /monitoring/feedback`

## Swagger
Swagger UI is available at:
`http://localhost:5001/api-docs`
