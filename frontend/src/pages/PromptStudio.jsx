import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import AppShell from '../components/AppShell.jsx';
import ModuleHeader from '../components/ModuleHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Badge from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { History, RotateCcw, Save, Sparkles, Trash2, FileText } from 'lucide-react';

const PromptStudio = () => {
  const [prompts, setPrompts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [name, setName] = useState('');
  const [module, setModule] = useState('shared');
  const [content, setContent] = useState('Write a prompt here.');
  const [preview, setPreview] = useState('');
  const [versions, setVersions] = useState([]);
  const [compareText, setCompareText] = useState('');
  const { pushToast } = useToast();

  const selectedPrompt = useMemo(() => prompts.find((prompt) => prompt.id === selectedId) || null, [prompts, selectedId]);

  const load = useCallback(async () => {
    const [{ data: promptsRes }, { data: templatesRes }] = await Promise.all([
      api.get('/prompts'),
      api.get('/prompts/templates')
    ]);
    setPrompts(promptsRes.prompts || []);
    setTemplates(templatesRes.templates || []);
    if (!selectedId && promptsRes.prompts?.length) setSelectedId(promptsRes.prompts[0].id);
  }, [selectedId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selectedPrompt) return;
    setName(selectedPrompt.name || '');
    setModule(selectedPrompt.module || 'shared');
    setContent(selectedPrompt.content || '');
    setPreview(selectedPrompt.content || '');
    (async () => {
      const { data } = await api.get(`/prompts/${selectedPrompt.id}/versions`);
      setVersions(data.versions || []);
    })();
  }, [selectedPrompt]);

  const save = async () => {
    if (selectedPrompt) {
      await api.put(`/prompts/${selectedPrompt.id}`, { name, module, content });
      await api.post('/prompts/version', { promptId: selectedPrompt.id, content });
      pushToast({ tone: 'success', title: 'Prompt updated', message: 'A new prompt version was saved.' });
    } else {
      const { data } = await api.post('/prompts', { name, module, content });
      setSelectedId(data.prompt.id);
      pushToast({ tone: 'success', title: 'Prompt saved', message: 'Prompt Studio created a new prompt.' });
    }
    await load();
  };

  const remove = async () => {
    if (!selectedPrompt) return;
    await api.delete(`/prompts/${selectedPrompt.id}`);
    setSelectedId('');
    setName('');
    setContent('');
    setPreview('');
    await load();
    pushToast({ tone: 'info', title: 'Prompt deleted', message: 'The selected prompt was removed.' });
  };

  const restore = async (versionId) => {
    await api.post('/prompts/restore', { versionId });
    await load();
    pushToast({ tone: 'success', title: 'Version restored', message: 'Rollback completed successfully.' });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <ModuleHeader
          eyebrow="Prompt Studio"
          title="Prompt management"
          description="Save prompts, edit versions, compare history, and restore any prior version without changing the shared AI layer."
          actions={<Badge tone="accent"><Sparkles size={14} className="mr-2 inline" /> versioned prompts</Badge>}
        />

        <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-semibold"><FileText size={16} /> Prompt list</h2>
              <Button variant="secondary" onClick={() => { setSelectedId(''); setName(''); setContent(''); }}><Save size={16} /> New</Button>
            </div>
            <div className="space-y-2">
              {prompts.length ? prompts.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => setSelectedId(prompt.id)}
                  className={`w-full rounded-2xl border px-3 py-3 text-left transition ${selectedId === prompt.id ? 'border-[var(--ui-accent)] bg-blue-50/60' : 'border-[var(--ui-border)] bg-[var(--ui-surface-muted)] hover:bg-[var(--ui-surface-muted)]'}`}
                >
                  <p className="font-medium">{prompt.name}</p>
                  <p className="mt-1 text-xs text-[var(--ui-text-muted)]">{prompt.module}</p>
                </button>
              )) : <EmptyState title="No prompts yet" description="Create your first prompt to begin version tracking." />}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="space-y-4">
              <h2 className="font-semibold">Editor</h2>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Prompt name" />
              <Input value={module} onChange={(e) => setModule(e.target.value)} placeholder="Module" />
              <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} className="w-full rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 font-mono text-sm outline-none transition focus:border-[var(--ui-focus)] focus:ring-4 focus:ring-blue-100/50" />
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" onClick={save}><Save size={16} /> Save</Button>
                <Button variant="secondary" onClick={() => setPreview(content)}><Sparkles size={16} /> Preview</Button>
                <Button variant="secondary" onClick={() => setCompareText(selectedPrompt?.content || content)}><History size={16} /> Compare</Button>
                <Button variant="danger" onClick={remove}><Trash2 size={16} /> Delete</Button>
              </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="space-y-4">
                <h2 className="font-semibold">Preview</h2>
                <pre className="overflow-auto rounded-2xl bg-[var(--ui-surface-muted)] p-4 text-sm">{preview || content || 'Preview will appear here.'}</pre>
              </Card>
              <Card className="space-y-4">
                <h2 className="font-semibold">Compare</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  <pre className="overflow-auto rounded-2xl bg-[var(--ui-surface-muted)] p-4 text-xs">{compareText || 'Select a prompt to compare.'}</pre>
                  <pre className="overflow-auto rounded-2xl bg-[var(--ui-surface-muted)] p-4 text-xs">{content || 'Current draft.'}</pre>
                </div>
              </Card>
            </div>

            <Card className="space-y-4">
              <h2 className="font-semibold">History</h2>
              <div className="space-y-3">
                {versions.length ? versions.map((version) => (
                  <article key={version.id} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">Version {version.version_number}</p>
                        <p className="text-xs text-[var(--ui-text-muted)]">{new Date(version.created_at).toLocaleString()}</p>
                      </div>
                      <Button variant="secondary" onClick={() => restore(version.id)}><RotateCcw size={16} /> Restore</Button>
                    </div>
                    <pre className="mt-3 overflow-auto rounded-xl bg-[var(--ui-surface)] p-3 text-xs">{version.content}</pre>
                  </article>
                )) : <EmptyState title="No versions yet" description="Save or version a prompt to populate the rollback history." />}
              </div>
            </Card>

            <Card className="space-y-4">
              <h2 className="font-semibold">Templates</h2>
              <div className="flex flex-wrap gap-2">
                {templates.length ? templates.map((template) => (
                  <button key={template.id} onClick={() => setContent(template.content)} className="rounded-full border border-[var(--ui-border)] px-3 py-2 text-xs font-semibold transition hover:bg-[var(--ui-surface-muted)]">
                    {template.name}
                  </button>
                )) : <p className="text-sm text-[var(--ui-text-muted)]">No templates available.</p>}
              </div>
            </Card>
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default PromptStudio;
