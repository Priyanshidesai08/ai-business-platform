import { execute, fetchAll, fetchOne } from '../../shared/db.js';

export const createWorkflow = async ({ userId, id, name, description, triggerType, steps, status }) =>
  fetchOne(
    `INSERT INTO workflows (id, created_by, name, description, trigger_type, steps, status)
     VALUES (COALESCE($1, uuid_generate_v4()), $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [id || null, userId, name, description || '', triggerType || 'manual', JSON.stringify(steps || []), status || 'draft']
  );

export const listWorkflows = async ({ userId }) =>
  fetchAll('SELECT * FROM workflows WHERE created_by = $1 ORDER BY created_at DESC', [userId]);

export const getWorkflowById = async ({ userId, workflowId }) =>
  fetchOne('SELECT * FROM workflows WHERE created_by = $1 AND id = $2', [userId, workflowId]);

export const updateWorkflowById = async ({ userId, workflowId, patch }) =>
  fetchOne(
    `UPDATE workflows
     SET name = COALESCE($3, name),
         description = COALESCE($4, description),
         trigger_type = COALESCE($5, trigger_type),
         steps = COALESCE($6, steps),
         status = COALESCE($7, status),
         updated_at = NOW()
     WHERE created_by = $1 AND id = $2
     RETURNING *`,
    [
      userId,
      workflowId,
      patch.name ?? null,
      patch.description ?? null,
      patch.triggerType ?? null,
      patch.steps ? JSON.stringify(patch.steps) : null,
      patch.status ?? null
    ]
  );

export const deleteWorkflowById = async ({ userId, workflowId }) =>
  execute('DELETE FROM workflows WHERE created_by = $1 AND id = $2', [userId, workflowId]);

export const createWorkflowRun = async ({ workflowId, userId, triggerType, status, input, output, currentStep }) =>
  fetchOne(
    `INSERT INTO workflow_runs (workflow_id, user_id, trigger_type, status, input, output, current_step)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [workflowId, userId, triggerType || 'manual', status || 'pending', JSON.stringify(input || {}), JSON.stringify(output || {}), currentStep || 0]
  );

export const updateWorkflowRunById = async ({ runId, patch }) =>
  fetchOne(
    `UPDATE workflow_runs
     SET status = COALESCE($2, status),
         input = COALESCE($3, input),
         output = COALESCE($4, output),
         current_step = COALESCE($5, current_step),
         error = COALESCE($6, error),
         started_at = COALESCE($7, started_at),
         completed_at = COALESCE($8, completed_at),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      runId,
      patch.status ?? null,
      patch.input ? JSON.stringify(patch.input) : null,
      patch.output ? JSON.stringify(patch.output) : null,
      patch.currentStep ?? null,
      patch.error ?? null,
      patch.startedAt ?? null,
      patch.completedAt ?? null
    ]
  );

export const getWorkflowRunById = async ({ userId, runId }) =>
  fetchOne('SELECT * FROM workflow_runs WHERE user_id = $1 AND id = $2', [userId, runId]);

export const listWorkflowRuns = async ({ userId, workflowId }) =>
  fetchAll(
    `SELECT * FROM workflow_runs
     WHERE user_id = $1 AND ($2::uuid IS NULL OR workflow_id = $2)
     ORDER BY created_at DESC`,
    [userId, workflowId || null]
  );

export const createWorkflowLog = async ({ runId, stepIndex, agent, action, status, message, input, output }) =>
  fetchOne(
    `INSERT INTO workflow_logs (run_id, step_index, agent, action, status, message, input, output)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [runId, stepIndex, agent, action, status, message || '', JSON.stringify(input || {}), JSON.stringify(output || {})]
  );

export const listWorkflowLogs = async ({ runId }) =>
  fetchAll('SELECT * FROM workflow_logs WHERE run_id = $1 ORDER BY created_at ASC', [runId]);

export const getLatestWorkflowRun = async ({ userId, workflowId }) =>
  fetchOne(
    `SELECT * FROM workflow_runs
     WHERE user_id = $1 AND workflow_id = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, workflowId]
  );

export const createWorkflowDefinition = async ({ userId, id, name, description, nodes, edges }) =>
  (async () => {
    const workflow = await fetchOne(
    `INSERT INTO workflow_definitions (id, created_by, name, description, nodes, edges)
     VALUES (COALESCE($1, uuid_generate_v4()), $2, $3, $4, $5, $6)
     RETURNING *`,
    [id || null, userId, name, description || '', JSON.stringify(nodes || []), JSON.stringify(edges || [])]
    );

    await execute('DELETE FROM workflow_nodes WHERE workflow_definition_id = $1', [workflow.id]);
    await execute('DELETE FROM workflow_edges WHERE workflow_definition_id = $1', [workflow.id]);

    for (const node of nodes || []) {
      await execute(
        `INSERT INTO workflow_nodes (workflow_definition_id, node_key, node_type, label, position, config)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          workflow.id,
          node.id || node.nodeKey || node.key || `${node.type || 'node'}-${Date.now()}`,
          node.type || 'node',
          node.label || node.config?.label || '',
          JSON.stringify(node.position || { x: 0, y: 0 }),
          JSON.stringify(node.config || {})
        ]
      );
    }

    for (const edge of edges || []) {
      await execute(
        `INSERT INTO workflow_edges (workflow_definition_id, edge_key, source_node_key, target_node_key, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          workflow.id,
          edge.id || edge.edgeKey || `${edge.from || 'edge'}-${edge.to || 'node'}`,
          edge.from || '',
          edge.to || '',
          JSON.stringify(edge.metadata || {})
        ]
      );
    }

    return workflow;
  })();

export const listWorkflowDefinitions = async ({ userId }) =>
  fetchAll('SELECT * FROM workflow_definitions WHERE created_by = $1 ORDER BY created_at DESC', [userId]);

export const getWorkflowDefinitionById = async ({ userId, workflowId }) =>
  fetchOne('SELECT * FROM workflow_definitions WHERE created_by = $1 AND id = $2', [userId, workflowId]);

export const updateWorkflowDefinitionById = async ({ userId, workflowId, patch }) =>
  (async () => {
    const workflow = await fetchOne(
    `UPDATE workflow_definitions
     SET name = COALESCE($3, name),
         description = COALESCE($4, description),
         nodes = COALESCE($5, nodes),
         edges = COALESCE($6, edges),
         updated_at = NOW()
     WHERE created_by = $1 AND id = $2
     RETURNING *`,
    [
      userId,
      workflowId,
      patch.name ?? null,
      patch.description ?? null,
      patch.nodes ? JSON.stringify(patch.nodes) : null,
      patch.edges ? JSON.stringify(patch.edges) : null
    ]
    );

    if (!workflow) return workflow;

    const nextNodes = patch.nodes || [];
    const nextEdges = patch.edges || [];

    await execute('DELETE FROM workflow_nodes WHERE workflow_definition_id = $1', [workflow.id]);
    await execute('DELETE FROM workflow_edges WHERE workflow_definition_id = $1', [workflow.id]);

    for (const node of nextNodes) {
      await execute(
        `INSERT INTO workflow_nodes (workflow_definition_id, node_key, node_type, label, position, config)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          workflow.id,
          node.id || node.nodeKey || node.key || `${node.type || 'node'}-${Date.now()}`,
          node.type || 'node',
          node.label || node.config?.label || '',
          JSON.stringify(node.position || { x: 0, y: 0 }),
          JSON.stringify(node.config || {})
        ]
      );
    }

    for (const edge of nextEdges) {
      await execute(
        `INSERT INTO workflow_edges (workflow_definition_id, edge_key, source_node_key, target_node_key, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          workflow.id,
          edge.id || edge.edgeKey || `${edge.from || 'edge'}-${edge.to || 'node'}`,
          edge.from || '',
          edge.to || '',
          JSON.stringify(edge.metadata || {})
        ]
      );
    }

    return workflow;
  })();

export const deleteWorkflowDefinitionById = async ({ userId, workflowId }) =>
  execute('DELETE FROM workflow_definitions WHERE created_by = $1 AND id = $2', [userId, workflowId]);
