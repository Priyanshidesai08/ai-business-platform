import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Business Platform API',
      version: '1.0.0',
      description: 'Authentication, AI, sales, marketing, support, analytics, memory, knowledge, prompts, and orchestration API for the Multi-Agent AI Business Automation Platform.'
    },
    servers: [
      {
        url: 'http://localhost:5001',
        description: 'Local development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Unauthorized' }
          }
        },
        AuthUser: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '11111111-1111-1111-1111-111111111111' },
            name: { type: 'string', example: 'Priya Sharma' },
            email: { type: 'string', example: 'priya@example.com' },
            role: { type: 'string', example: 'user' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Login successful' },
            token: { type: 'string', example: 'eyJhbGciOi...' },
            user: { $ref: '#/components/schemas/AuthUser' }
          }
        },
        ForgotPasswordInput: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', example: 'priya@example.com' }
          }
        },
        ForgotPasswordResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Reset link sent' }
          }
        },
        ResetPasswordInput: {
          type: 'object',
          required: ['token', 'password'],
          properties: {
            token: { type: 'string', example: 'secure-reset-token' },
            password: { type: 'string', example: 'SecurePass123' }
          }
        },
        ResetPasswordResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Password reset successful' }
          }
        },
        LeadInput: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: { type: 'string', example: 'Priya Sharma' },
            email: { type: 'string', example: 'priya@example.com' },
            company: { type: 'string', example: 'Acme Ltd' },
            budget: { type: 'string', example: '10000' },
            urgency: { type: 'string', example: 'high' },
            companySize: { type: 'string', example: '200' },
            interest: { type: 'string', example: 'automation' },
            notes: { type: 'string', example: 'Interested in AI workflow.' }
          }
        },
        MarketingInput: {
          type: 'object',
          required: ['audience', 'objective', 'tone', 'platform'],
          properties: {
            audience: { type: 'string', example: 'SMBs' },
            objective: { type: 'string', example: 'Lead generation' },
            tone: { type: 'string', example: 'professional' },
            platform: { type: 'string', example: 'linkedin' }
          }
        },
        SupportChatInput: {
          type: 'object',
          required: ['message'],
          properties: {
            message: { type: 'string', example: 'How do I reset my account?' },
            history: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  role: { type: 'string', example: 'user' },
                  content: { type: 'string', example: 'I need help with billing.' }
                }
              }
            }
          }
        },
        TicketInput: {
          type: 'object',
          required: ['subject'],
          properties: {
            customerName: { type: 'string', example: 'Priya Sharma' },
            subject: { type: 'string', example: 'Need rollout support' },
            status: { type: 'string', example: 'open' },
            priority: { type: 'string', example: 'normal' },
            history: { type: 'array', items: { type: 'object' } },
            aiResponse: { type: 'string', example: 'Please follow these steps...' }
          }
        },
        OrchestrationRequest: {
          type: 'object',
          required: ['request'],
          properties: {
            request: { type: 'string', example: 'Generate campaign for new customer' },
            goal: { type: 'string', example: 'Qualify the lead, launch the campaign, and summarize performance.' },
            context: { type: 'object', example: { customer: { name: 'Acme', email: 'buyer@example.com', company: 'Acme Ltd' } } },
            approvals: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  agent: { type: 'string', example: 'marketing' },
                  approved: { type: 'boolean', example: true }
                }
              }
            },
            workflow: {
              type: 'object',
              properties: {
                order: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['sales', 'marketing', 'analytics']
                }
              }
            }
          }
        },
        MemoryMessageInput: {
          type: 'object',
          required: ['role', 'message'],
          properties: {
            sessionId: { type: 'string', example: 'memory-session-001' },
            role: { type: 'string', example: 'user' },
            message: { type: 'string', example: 'Please remember this context for later.' },
            metadata: { type: 'object', example: { source: 'ui', tags: ['support'] } }
          }
        },
        MemorySessionInput: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', example: 'memory-session-001' },
            activeWork: { type: 'string', example: 'Drafting follow-up plan' },
            draft: { type: 'string', example: 'Pending notes' },
            timeoutAt: { type: 'string', example: '2026-06-14T12:00:00.000Z' },
            metadata: { type: 'object', example: { route: '/memory' } }
          }
        },
        MemoryAgentInput: {
          type: 'object',
          required: ['agentId'],
          properties: {
            agentId: { type: 'string', example: 'sales' },
            summary: { type: 'string', example: 'Remember the customer prefers a short follow-up.' },
            shortTerm: { type: 'array', items: { type: 'object' } },
            longTerm: { type: 'array', items: { type: 'object' } },
            decisions: { type: 'array', items: { type: 'object' } },
            context: { type: 'object', example: { sessionId: 'memory-session-001' } }
          }
        },
        KnowledgeUploadInput: {
          type: 'object',
          required: ['filename', 'content'],
          properties: {
            filename: { type: 'string', example: 'guide.txt' },
            mimeType: { type: 'string', example: 'text/plain' },
            originalName: { type: 'string', example: 'guide.txt' },
            content: { type: 'string', example: 'Document content to chunk and retrieve.' },
            metadata: { type: 'object', example: { source: 'ui' } }
          }
        },
        KnowledgeRetrieveInput: {
          type: 'object',
          properties: {
            documentIds: { type: 'array', items: { type: 'string' }, example: ['doc-1'] },
            query: { type: 'string', example: 'beta keyword' }
          }
        },
        PromptInput: {
          type: 'object',
          required: ['name', 'content'],
          properties: {
            name: { type: 'string', example: 'Lead score prompt' },
            module: { type: 'string', example: 'sales' },
            content: { type: 'string', example: 'Evaluate a lead and return JSON.' },
            metadata: { type: 'object', example: { tags: ['sales', 'quality'] } }
          }
        },
        PromptVersionInput: {
          type: 'object',
          required: ['promptId'],
          properties: {
            promptId: { type: 'string', example: 'prompt-1' },
            content: { type: 'string', example: 'Updated prompt content' },
            metadata: { type: 'object', example: { note: 'v2' } }
          }
        },
        PromptRestoreInput: {
          type: 'object',
          required: ['versionId'],
          properties: {
            versionId: { type: 'string', example: 'version-1' }
          }
        },
        WorkflowInput: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'New customer campaign flow' },
            description: { type: 'string', example: 'Sales to marketing to analytics workflow' },
            triggerType: { type: 'string', example: 'manual' },
            status: { type: 'string', example: 'draft' },
            steps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  agent: { type: 'string', example: 'sales' },
                  action: { type: 'string', example: 'qualify' },
                  input: { type: 'object', example: { leadId: 'lead-1' } },
                  output: { type: 'object', example: { score: 88 } },
                  retry: { type: 'integer', example: 1 },
                  timeout: { type: 'integer', example: 30000 },
                  condition: { type: 'string', example: 'if score > 70' }
                }
              }
            }
          }
        },
        WorkflowBuilderNode: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'node-1' },
            type: { type: 'string', example: 'agent' },
            label: { type: 'string', example: 'Sales Agent' },
            position: {
              type: 'object',
              properties: {
                x: { type: 'number', example: 180 },
                y: { type: 'number', example: 120 }
              }
            },
            config: { type: 'object', example: { agent: 'sales', action: 'qualify' } }
          }
        },
        WorkflowBuilderEdge: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'edge-1' },
            from: { type: 'string', example: 'node-1' },
            to: { type: 'string', example: 'node-2' }
          }
        },
        WorkflowBuilderInput: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'New customer builder flow' },
            description: { type: 'string', example: 'Persisted workflow builder graph' },
            nodes: {
              type: 'array',
              items: { $ref: '#/components/schemas/WorkflowBuilderNode' }
            },
            edges: {
              type: 'array',
              items: { $ref: '#/components/schemas/WorkflowBuilderEdge' }
            }
          }
        },
        WorkflowBuilderDefinition: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'workflow-1' },
            created_by: { type: 'string', example: 'user-1' },
            name: { type: 'string', example: 'New customer builder flow' },
            description: { type: 'string', example: 'Persisted workflow builder graph' },
            nodes: {
              type: 'array',
              items: { $ref: '#/components/schemas/WorkflowBuilderNode' }
            },
            edges: {
              type: 'array',
              items: { $ref: '#/components/schemas/WorkflowBuilderEdge' }
            }
          }
        },
        WorkflowRunInput: {
          type: 'object',
          properties: {
            workflowId: { type: 'string', example: 'workflow-1' },
            triggerType: { type: 'string', example: 'manual' },
            input: { type: 'object', example: { leadId: 'lead-1' } }
          }
        },
        WorkflowRun: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'run-1' },
            workflow_id: { type: 'string', example: 'workflow-1' },
            user_id: { type: 'string', example: 'user-1' },
            trigger_type: { type: 'string', example: 'manual' },
            status: { type: 'string', example: 'success' },
            current_step: { type: 'integer', example: 2 },
            started_at: { type: 'string', example: '2026-06-14T00:00:00.000Z' }
          }
        },
        WorkflowLog: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'log-1' },
            run_id: { type: 'string', example: 'run-1' },
            agent: { type: 'string', example: 'sales' },
            action: { type: 'string', example: 'qualify' },
            status: { type: 'string', example: 'running' },
            message: { type: 'string', example: 'Running step 1' },
            created_at: { type: 'string', example: '2026-06-14T00:00:00.000Z' }
          }
        },
        InsightsPredictionInput: {
          type: 'object',
          properties: {
            horizon: { type: 'string', example: '30d' }
          }
        },
        InsightsMetrics: {
          type: 'object',
          properties: {
            leadConversion: { type: 'number', example: 42.5 },
            campaignSuccess: { type: 'number', example: 66.25 },
            supportResolution: { type: 'number', example: 71.1 },
            workflowEfficiency: { type: 'number', example: 83.9 }
          }
        },
        ContextGenerateInput: {
          type: 'object',
          required: ['module'],
          properties: {
            module: { type: 'string', example: 'sales' },
            template: { type: 'string', example: 'leadScore' },
            promptId: { type: 'string', example: 'prompt-1' },
            input: { type: 'object', example: { lead: { name: 'Acme', budget: 10000 } } },
            context: {
              type: 'object',
              example: {
                sessionId: 'memory-session-001',
                documentIds: ['doc-1'],
                query: 'acme lead'
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/modules/**/*.routes.js']
};

const swaggerDocs = swaggerJsdoc(options);

export { swaggerDocs, swaggerUi };
