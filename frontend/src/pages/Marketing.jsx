import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import AppShell from '../components/AppShell.jsx';
import ModuleHeader from '../components/ModuleHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Badge from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Download, Megaphone, Save, Wand2, Sparkles, Repeat2 } from 'lucide-react';

const baseForm = { audience: '', objective: '', tone: 'professional', platform: 'linkedin' };

const Marketing = () => {
  const [form, setForm] = useState(baseForm);
  const [content, setContent] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [activeDraft, setActiveDraft] = useState('post');
  const { pushToast } = useToast();

  const load = async () => {
    const { data } = await api.get('/marketing/campaigns');
    setCampaigns(data.campaigns || []);
  };

  useEffect(() => { load(); }, []);

  const generate = async (path) => {
    const { data } = await api.post(path, form);
    setContent(data);
    pushToast({ tone: 'success', title: 'Content generated', message: 'Draft saved for review.' });
    await load();
  };

  const exportCampaign = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      form,
      content,
      campaigns
    };
    const blob = new globalThis.Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = globalThis.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `campaign-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => globalThis.URL.revokeObjectURL(url), 1000);
    pushToast({ tone: 'success', title: 'Export downloaded', message: 'Campaign package is ready.' });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <ModuleHeader
          eyebrow="Marketing Agent"
          title="Campaign dashboard"
          description="Generate content for posts, emails, campaigns, and ad copy, then refine and save outputs in PostgreSQL."
          actions={<Badge tone="accent"><Megaphone size={14} className="mr-2 inline" /> Inputs ready</Badge>}
        />

        <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <Card className="space-y-3">
            <div className="flex flex-wrap gap-2 pb-2">
              {[
                { key: 'post', label: 'Post' },
                { key: 'email', label: 'Email' },
                { key: 'campaign', label: 'Campaign' },
                { key: 'adcopy', label: 'Ad Copy' }
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveDraft(item.key)}
                  className={`rounded-full px-3 py-2 text-xs font-semibold transition ${activeDraft === item.key ? 'bg-[var(--ui-accent)] text-white' : 'bg-[var(--ui-surface-muted)] text-[var(--ui-text-muted)]'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {Object.entries(form).map(([key, value]) => (
              <Input key={key} value={value} onChange={(e) => setForm((c) => ({ ...c, [key]: e.target.value }))} placeholder={key} />
            ))}
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="primary" onClick={() => generate('/marketing/post')}><Wand2 size={16} /> Post</Button>
              <Button type="button" variant="primary" onClick={() => generate('/marketing/email')}><Wand2 size={16} /> Email</Button>
              <Button type="button" variant="primary" onClick={() => generate('/marketing/campaign')}><Wand2 size={16} /> Campaign</Button>
              <Button type="button" variant="primary" onClick={() => generate('/marketing/adcopy')}><Wand2 size={16} /> Ad Copy</Button>
            </div>
          </Card>

          <div className="space-y-4">
            {content ? (
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-lg font-semibold"><Sparkles size={16} /> Generated content</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary"><Repeat2 size={16} /> Regenerate</Button>
                    <Button variant="secondary"><Save size={16} /> Save</Button>
                    <Button variant="secondary" onClick={exportCampaign}><Download size={16} /> Export Campaign</Button>
                  </div>
                </div>
                <pre className="mt-3 overflow-auto text-sm">{JSON.stringify(content, null, 2)}</pre>
              </Card>
            ) : (
              <EmptyState title="No generation yet" description="Choose a draft type and generate content to populate the workspace." />
            )}

            {campaigns.length ? campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <h3 className="font-semibold">{campaign.content_type}</h3>
                <pre className="mt-2 overflow-auto text-sm">{campaign.content}</pre>
              </Card>
            )) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default Marketing;
