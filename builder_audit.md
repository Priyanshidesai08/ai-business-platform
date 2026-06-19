# Builder Audit

## Implemented

- Workflow builder page exists and persists local state
  - `frontend/src/pages/WorkflowBuilderNoCode.jsx`
  - `frontend/src/workflow-builder/nodeEngine.js`
- Builder node library exists with trigger, agent, decision, action, and end nodes
  - `frontend/src/workflow-builder/nodeEngine.js`
- Basic node create, delete, duplicate, rename, move, and connect helpers exist
  - `frontend/src/workflow-builder/nodeEngine.js`
- Builder can save, load, list, and delete workflow definitions through backend routes
  - `backend/src/modules/workflow/builder.routes.js`
  - `backend/src/modules/workflow/workflow.controller.js`
  - `backend/src/modules/workflow/workflow.service.js`
  - `backend/src/modules/workflow/workflow.repository.js`
- Builder can run workflows and expose pause, resume, stop, status, logs, and runs endpoints
  - `backend/src/modules/workflow/builder.routes.js`
  - `backend/src/modules/workflow/workflow.controller.js`
  - `backend/src/modules/workflow/workflow.service.js`
- Builder persistence tables exist
  - `database/migrations/013_workflow_builder.sql`
- Builder UI includes:
  - node library
  - canvas
  - properties panel
  - saved workflow list
  - execution console
  - minimap
  - undo/redo buttons
  - import/export
  - keyboard shortcuts for copy/paste and undo/redo
  - `frontend/src/pages/WorkflowBuilderNoCode.jsx`
- Builder backend and frontend tests exist
  - `backend/tests/unit/workflow-builder-service.test.js`
  - `backend/tests/integration/workflow-builder.test.js`

## Partial

- Node system is present, but some requested advanced behaviors are only partially covered
  - multi-select is not implemented
  - keyboard move shortcuts are not implemented
  - alignment guides are not implemented
  - `frontend/src/pages/WorkflowBuilderNoCode.jsx`
- Connection system exists, but advanced validation is still basic
  - loops are not explicitly validated
  - broken-chain detection is minimal
  - branching conditions are represented only in data, not strongly enforced in UI
  - `frontend/src/workflow-builder/nodeEngine.js`
  - `frontend/src/pages/WorkflowBuilderNoCode.jsx`
- Autosave/restore exists, but history is lightweight rather than a full versioned workflow history
  - `frontend/src/pages/WorkflowBuilderNoCode.jsx`
- Execution console works, but live incremental step streaming is not yet a full realtime event stream
  - `frontend/src/pages/WorkflowBuilderNoCode.jsx`
  - `backend/src/modules/workflow/workflow.service.js`

## Missing

- Browser proof of the latest builder flow in this environment
- Manual device validation on real phone/tablet/desktop hardware
- True drag-select / multi-select canvas interactions
- Clipboard paste of multiple selected nodes
- Visual alignment guides and snap-to-element hints
- Explicit loop prevention in the connection engine
- Rich execution history persistence table and UI timeline beyond the current logs list

## Broken

- Unit/integration proof is generally in place, but the builder stack still needs live browser verification for the latest Phase 6 controls
- Some of the advanced builder UX requirements are not yet implemented, so they remain functionally absent rather than broken

## Files Involved

- `frontend/src/pages/WorkflowBuilderNoCode.jsx`
- `frontend/src/workflow-builder/nodeEngine.js`
- `backend/src/modules/workflow/builder.routes.js`
- `backend/src/modules/workflow/workflow.controller.js`
- `backend/src/modules/workflow/workflow.service.js`
- `backend/src/modules/workflow/workflow.repository.js`
- `database/migrations/013_workflow_builder.sql`
- `backend/tests/unit/workflow-builder-service.test.js`
- `backend/tests/integration/workflow-builder.test.js`
