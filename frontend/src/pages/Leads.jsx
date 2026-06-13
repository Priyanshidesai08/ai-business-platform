import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import AppShell from '../components/AppShell.jsx';
import ModuleHeader from '../components/ModuleHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Badge from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ArrowRight, BadgePercent, CalendarClock, ListFilter, PencilLine, Sparkles } from 'lucide-react';

const emptyLead = { name: '', email: '', company: '', budget: '', urgency: '', companySize: '', interest: '', notes: '' };

const Leads = () => {
  const [form, setForm] = useState(emptyLead);
  const [leads, setLeads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { pushToast } = useToast();

  const loadLeads = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/sales/leads');
      setLeads(data.leads || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLeads(); }, []);

  const scoreLead = async (leadId) => {
    const { data } = await api.post('/sales/score', { leadId });
    setAiResult(data.ai);
    pushToast({ tone: 'success', title: 'Lead scored', message: 'AI qualification updated.' });
    await loadLeads();
  };

  const followUpLead = async (leadId) => {
    const { data } = await api.post('/sales/followup', { leadId });
    setAiResult(data.ai);
    pushToast({ tone: 'info', title: 'Follow-up generated', message: 'Next action is ready.' });
    await loadLeads();
  };

  const saveLead = async (event) => {
    event.preventDefault();
    await api.post('/sales/leads', form);
    setForm(emptyLead);
    pushToast({ tone: 'success', title: 'Lead saved', message: 'The record was stored in PostgreSQL.' });
    await loadLeads();
  };

  const selectedLead = useMemo(() => leads.find((lead) => lead.id === selected) || null, [leads, selected]);

  return (
    <AppShell>
      <div className="space-y-6">
        <ModuleHeader
          eyebrow="Sales Agent"
          title="Leads"
          description="Capture, score, and qualify leads with AI-backed follow-up generation and editable CRM notes."
          actions={(
            <div className="grid grid-cols-3 gap-3 text-sm">
              <Card className="p-4">
                <p className="flex items-center gap-2 font-semibold"><Sparkles size={16} /> Capture</p>
                <p className="mt-1 text-xs text-[var(--ui-text-muted)]">Create a lead record</p>
              </Card>
              <Card className="p-4">
                <p className="flex items-center gap-2 font-semibold"><BadgePercent size={16} /> Score</p>
                <p className="mt-1 text-xs text-[var(--ui-text-muted)]">0 - 100 qualification</p>
              </Card>
              <Card className="p-4">
                <p className="flex items-center gap-2 font-semibold"><ArrowRight size={16} /> Follow-up</p>
                <p className="mt-1 text-xs text-[var(--ui-text-muted)]">AI next action</p>
              </Card>
            </div>
          )}
        />

        <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <Card>
            <h2 className="flex items-center gap-2 text-lg font-semibold"><ListFilter size={18} /> Lead capture</h2>
            <div className="mt-4 grid gap-3">
              {Object.entries(form).map(([key, value]) => (
                <Input
                  key={key}
                  value={value}
                  onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))}
                  placeholder={key}
                />
              ))}
            </div>
            <Button type="submit" variant="primary" className="mt-4 w-full" onClick={saveLead}>
              Save lead <ArrowRight size={16} />
            </Button>
          </Card>

          <div className="space-y-4">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-44" />
                <Skeleton className="h-44" />
              </div>
            ) : leads.length ? (
              leads.map((lead) => (
                <Card key={lead.id} className="transition hover:-translate-y-0.5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{lead.name}</h3>
                      <p className="text-sm text-[var(--ui-text-muted)]">{lead.email}</p>
                    </div>
                    <Badge tone={lead.category === 'Hot' ? 'warning' : 'accent'}>{lead.category} {lead.score}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-[var(--ui-text-muted)]">{lead.company}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => { setSelected(lead.id); setModalOpen(true); }}>Detail</Button>
                    <Button variant="secondary" onClick={() => scoreLead(lead.id)}>Score</Button>
                    <Button variant="secondary" onClick={() => followUpLead(lead.id)}>Follow-up</Button>
                  </div>
                </Card>
              ))
            ) : (
              <EmptyState
                title="No leads yet"
                description="Create the first lead to start scoring and follow-up generation."
                actionLabel="Open capture form"
                onAction={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              />
            )}
          </div>
        </section>

        <Modal open={modalOpen && Boolean(selectedLead)} title="Lead detail" onClose={() => setModalOpen(false)}>
          {selectedLead && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <p className="flex items-center gap-2 text-sm font-medium"><PencilLine size={16} /> Notes</p>
                <p className="mt-2 text-sm text-[var(--ui-text-muted)]">{selectedLead.notes || 'No notes yet.'}</p>
              </Card>
              <Card>
                <p className="flex items-center gap-2 text-sm font-medium"><CalendarClock size={16} /> Follow-up</p>
                <p className="mt-2 whitespace-pre-line text-sm text-[var(--ui-text-muted)]">{selectedLead.follow_up || 'No follow-up generated yet.'}</p>
              </Card>
            </div>
          )}
        </Modal>

        {aiResult ? (
          <Card>
            <h2 className="text-lg font-semibold">AI result</h2>
            <pre className="mt-2 overflow-auto text-sm">{JSON.stringify(aiResult, null, 2)}</pre>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
};

export default Leads;
