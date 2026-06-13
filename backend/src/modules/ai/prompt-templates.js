export const templates = {
  leadScore: ({ lead }) => `
You are a sales qualification assistant.
Evaluate this lead using budget, urgency, company size, and interest.
Return JSON with: score (0-100), category (Hot/Warm/Cold), summary, followUp, nextAction.
Lead: ${JSON.stringify(lead)}
`.trim(),
  followUp: ({ lead }) => `
Write a short follow-up email and next action for this lead.
Return JSON with: emailSubject, emailBody, nextAction.
Lead: ${JSON.stringify(lead)}
`.trim(),
  marketingPost: ({ input }) => `
Generate a social post in the requested tone/platform. Return JSON with content and title.
Input: ${JSON.stringify(input)}
`.trim(),
  marketingEmail: ({ input }) => `
Generate a marketing email. Return JSON with subject and body.
Input: ${JSON.stringify(input)}
`.trim(),
  marketingCampaign: ({ input }) => `
Generate a campaign plan and content. Return JSON with name, description, content.
Input: ${JSON.stringify(input)}
`.trim(),
  marketingAdCopy: ({ input }) => `
Generate ad copy variations. Return JSON with primaryText, headline, description.
Input: ${JSON.stringify(input)}
`.trim(),
  marketingCampaignPlan: ({ input }) => `
Create a launch campaign plan with timeline, audience, channels, budget notes, and CTA.
Return JSON with name, objective, phases, and successMetrics.
Input: ${JSON.stringify(input)}
`.trim(),
  salesLeadNotes: ({ lead }) => `
Turn this lead into editable CRM notes with objections, opportunities, and recommended approach.
Return JSON with summary, objections, opportunities, nextSteps.
Lead: ${JSON.stringify(lead)}
`.trim(),
  salesAccountPlan: ({ lead }) => `
Create a short account plan for this lead with relationship strategy, risk flags, and a close plan.
Return JSON with accountSnapshot, priorities, risks, nextSteps, and closingMessage.
Lead: ${JSON.stringify(lead)}
`.trim(),
  supportChat: ({ message, history }) => `
You are a customer support assistant. Be concise and helpful.
Return JSON with response, sentiment, suggestedStatus.
History: ${JSON.stringify(history || [])}
Message: ${message}
`.trim(),
  supportResolution: ({ ticket }) => `
Draft a support resolution summary and next steps.
Return JSON with summary, resolution, customerTone, and escalationNeeded.
Ticket: ${JSON.stringify(ticket)}
`.trim(),
  supportFollowThrough: ({ ticket }) => `
Write a follow-through update for the customer and internal team after the issue is handled.
Return JSON with customerUpdate, internalNote, nextCheckIn, and escalationRisk.
Ticket: ${JSON.stringify(ticket)}
`.trim(),
  analyticsSummary: ({ metrics }) => `
Summarize this business data and return JSON with insights and recommendations.
Metrics: ${JSON.stringify(metrics)}
`.trim()
};

export const templateNames = Object.keys(templates);
