import { useState } from 'react';
import { api } from '../api/client.js';
import AppShell from '../components/AppShell.jsx';
import ModuleHeader from '../components/ModuleHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Bot, PlayCircle, RotateCcw, Sparkles } from 'lucide-react';

const AIStudio = () => {
  const [module, setModule] = useState('sales');
  const [template, setTemplate] = useState('leadScore');
  const [input, setInput] = useState('{}');
  const [result, setResult] = useState(null);
  const { pushToast } = useToast();

  const presets = [
    { label: 'Lead score', module: 'sales', template: 'leadScore', input: { lead: { name: 'Northstar Logistics', budget: 12000, urgency: 'high', companySize: 'mid-market', interest: 'strong' } } },
    { label: 'Campaign plan', module: 'marketing', template: 'marketingCampaignPlan', input: { input: { audience: 'B2B SaaS founders', objective: 'book demos', tone: 'confident', platform: 'linkedin' } } },
    { label: 'Support resolution', module: 'support', template: 'supportResolution', input: { ticket: { subject: 'Billing issue', status: 'open', message: 'Invoice mismatch for enterprise plan' } } }
  ];

  const generate = async () => {
    const { data } = await api.post('/ai/generate', { module, template, input: JSON.parse(input) });
    setResult(data);
    pushToast({ tone: 'success', title: 'AI response received', message: 'Parsed output is ready for review.' });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <ModuleHeader
          eyebrow="AI Layer"
          title="AI Studio"
          description="Send structured prompts to the shared AI service and inspect the parsed output used by every module."
          actions={<Button variant="secondary"><Bot size={16} /> Shared prompts</Button>}
        />

        <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <Card className="space-y-3">
            <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-3">
              <p className="flex items-center gap-2 text-sm font-medium"><Sparkles size={16} /> Quick presets</p>
              <div className="mt-3 grid gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setModule(preset.module);
                      setTemplate(preset.template);
                      setInput(JSON.stringify(preset.input, null, 2));
                    }}
                    className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-left text-sm transition hover:bg-[var(--ui-surface-muted)]"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <Input value={module} onChange={(e) => setModule(e.target.value)} />
            <Input value={template} onChange={(e) => setTemplate(e.target.value)} />
            <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={10} className="w-full rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 font-mono text-sm outline-none transition focus:border-[var(--ui-focus)] focus:ring-4 focus:ring-blue-100/50" />
            <div className="flex gap-2">
              <Button variant="primary" onClick={generate}><PlayCircle size={16} /> Generate</Button>
              <Button variant="secondary" onClick={() => setResult(null)}><RotateCcw size={16} /> Clear</Button>
            </div>
          </Card>

          <Card>
            {result ? <pre className="overflow-auto text-sm">{JSON.stringify(result, null, 2)}</pre> : <EmptyState title="No output yet" description="Run a prompt to inspect the parsed AI response and token payload." />}
          </Card>
        </section>
      </div>
    </AppShell>
  );
};

export default AIStudio;
