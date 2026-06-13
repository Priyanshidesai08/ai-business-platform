import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Business Platform API',
      version: '1.0.0',
      description: 'Authentication, AI, sales, marketing, support, and analytics API for the Multi-Agent AI Business Automation Platform.'
    },
    servers: [
      {
        url: 'http://localhost:5000',
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
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/modules/**/*.routes.js']
};

const swaggerDocs = swaggerJsdoc(options);

export { swaggerDocs, swaggerUi };
