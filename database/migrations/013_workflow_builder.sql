CREATE TABLE IF NOT EXISTS workflow_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_definition_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  node_key VARCHAR(255) NOT NULL,
  node_type VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL DEFAULT '',
  position JSONB NOT NULL DEFAULT '{"x":0,"y":0}'::jsonb,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_definition_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  edge_key VARCHAR(255) NOT NULL,
  source_node_key VARCHAR(255) NOT NULL,
  target_node_key VARCHAR(255) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_definitions_created_by ON workflow_definitions(created_by);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_created_at ON workflow_definitions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_nodes_definition_id ON workflow_nodes(workflow_definition_id);
CREATE INDEX IF NOT EXISTS idx_workflow_edges_definition_id ON workflow_edges(workflow_definition_id);
