import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import AppShell from '../components/AppShell.jsx';
import ModuleHeader from '../components/ModuleHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Badge from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Archive, BrainCircuit, Clock3, MessageSquareText, Trash2, RefreshCcw } from 'lucide-react';

const sessionKey = 'memory-session-id';

const Memory = () => {
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(() => localStorage.getItem(sessionKey) || `memory-${Date.now()}`);
  const [sessionMemory, setSessionMemory] = useState(null);
  const [agentMemory, setAgentMemory] = useState(null);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [agentId, setAgentId] = useState('sales');
  const [agentSummary, setAgentSummary] = useState('');
  const { pushToast } = useToast();

  const currentSessionId = selectedSessionId;

  const load = async (query = '') => {
    const [{ data: historyData }, { data: sessionData }, { data: agentData }] = await Promise.all([
      api.get('/memory/history', { params: query ? { query } : {} }),
      api.get('/memory/session', { params: { sessionId: currentSessionId } }),
      api.get(`/memory/agent/${agentId}`)
    ]);

    const nextMessages = historyData.messages || [];
    setMessages(nextMessages);
    setSessions(Array.from(new Map(nextMessages.map((item) => [item.session_id, item])).entries()).map(([sessionId, item]) => ({
      sessionId,
      lastMessage: item.message,
      createdAt: item.created_at
    })));
    setSessionMemory(sessionData.session || null);
    setAgentMemory(agentData.memory || null);
  };

  useEffect(() => {
    load(search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  useEffect(() => {
    localStorage.setItem(sessionKey, currentSessionId);
  }, [currentSessionId]);

  useEffect(() => {
    const timeout = setTimeout(() => load(search), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, agentId, selectedSessionId]);

  const selectedMessages = useMemo(
    () => messages.filter((item) => item.session_id === currentSessionId),
    [messages, currentSessionId]
  );

  const restoreSession = async (sessionId) => {
    setSelectedSessionId(sessionId);
    const { data } = await api.get(`/memory/history/${sessionId}`);
    setMessages((current) => {
      const others = current.filter((item) => item.session_id !== sessionId);
      return [...others, ...(data.messages || [])];
    });
  };

  const saveMessage = async (role, message) => {
    await api.post('/memory/messages', {
      sessionId: currentSessionId,
      role,
      message,
      metadata: { source: 'memory-center' }
    });
    await api.post('/memory/session', {
      sessionId: currentSessionId,
      activeWork: draft,
      draft,
      metadata: { search }
    });
    await load(search);
  };

  const sendConversation = async () => {
    if (!draft.trim()) return;
    await saveMessage('user', draft);
    await saveMessage('agent', `Memory captured for ${currentSessionId}.`);
    setDraft('');
    pushToast({ tone: 'success', title: 'Conversation saved', message: 'The session now restores on refresh.' });
  };

  const saveAgent = async () => {
    await api.post('/memory/agent', {
      agentId,
      summary: agentSummary || `Memory summary for ${agentId}`,
      shortTerm: selectedMessages.slice(-3),
      longTerm: selectedMessages.slice(0, 3),
      decisions: [{ note: 'Preserve earlier context for future prompts.' }],
      context: { sessionId: currentSessionId }
    });
    await load(search);
    pushToast({ tone: 'success', title: 'Agent memory saved', message: `${agentId} now has persistent context.` });
  };

  const deleteSession = async (sessionId) => {
    await api.delete(`/memory/history/${sessionId}`);
    if (sessionId === currentSessionId) {
      setSelectedSessionId('');
      localStorage.removeItem(sessionKey);
    }
    await load(search);
    pushToast({ tone: 'info', title: 'Conversation deleted', message: 'The selected session was removed.' });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <ModuleHeader
          eyebrow="Memory Center"
          title="Persistent conversation memory"
          description="Save conversation history, restore active sessions after refresh, and keep agent memory available for future interactions."
          actions={<Badge tone="accent"><BrainCircuit size={14} className="mr-2 inline" /> session-aware</Badge>}
        />

        <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-semibold"><MessageSquareText size={16} /> Conversation list</h2>
              <Button variant="secondary" onClick={() => load(search)}><RefreshCcw size={16} /> Refresh</Button>
            </div>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations" />
            <div className="space-y-2">
              {sessions.length ? sessions.map((item) => (
                <article key={item.sessionId} className={`rounded-2xl border p-3 ${item.sessionId === currentSessionId ? 'border-[var(--ui-accent)] bg-blue-50/40' : 'border-[var(--ui-border)] bg-[var(--ui-surface-muted)]'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <button className="text-left" onClick={() => restoreSession(item.sessionId)}>
                      <p className="font-medium">{item.sessionId}</p>
                      <p className="mt-1 text-xs text-[var(--ui-text-muted)]">{item.lastMessage}</p>
                    </button>
                    <button type="button" className="rounded-lg border border-[var(--ui-border)] p-2" onClick={() => deleteSession(item.sessionId)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-[var(--ui-text-muted)]"><Clock3 size={12} /> {new Date(item.createdAt).toLocaleString()}</p>
                </article>
              )) : <EmptyState title="No conversations" description="Send a message to begin a persistent session." />}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">Conversation detail</h2>
                <Badge tone="success">{currentSessionId}</Badge>
              </div>
              <div className="min-h-[18rem] space-y-3 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                {selectedMessages.length ? selectedMessages.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-[var(--ui-surface)] px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
                      {item.role} · {new Date(item.created_at).toLocaleTimeString()}
                    </p>
                    <p className="mt-1 text-sm">{item.message}</p>
                  </div>
                )) : <EmptyState title="Conversation detail is empty" description="Restore or create a session to populate the timeline." />}
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message to save into memory" />
                <Button variant="primary" onClick={sendConversation}><MessageSquareText size={16} /> Save</Button>
              </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="space-y-4">
                <h2 className="font-semibold">Session memory</h2>
                <div className="space-y-3">
                  <Input value={currentSessionId} onChange={(e) => setSelectedSessionId(e.target.value)} placeholder="session id" />
                  <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="active work" />
                </div>
                <Button variant="secondary" onClick={() => api.post('/memory/session', { sessionId: currentSessionId, activeWork: draft, draft, metadata: { restored: true } }).then(() => load(search))}>
                  <Archive size={16} /> Autosave session
                </Button>
                <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-3 text-sm text-[var(--ui-text-muted)]">
                  <p className="font-medium text-[var(--ui-text)]">Restore state</p>
                  <p className="mt-1">Reloading will fetch the same session id and its stored draft/work payload.</p>
                  <pre className="mt-3 overflow-auto text-xs">{JSON.stringify(sessionMemory?.payload || sessionMemory, null, 2)}</pre>
                </div>
              </Card>

              <Card className="space-y-4">
                <h2 className="font-semibold">Agent memory</h2>
                <Input value={agentId} onChange={(e) => setAgentId(e.target.value)} placeholder="agent id" />
                <Input value={agentSummary} onChange={(e) => setAgentSummary(e.target.value)} placeholder="summary" />
                <Button variant="primary" onClick={saveAgent}><BrainCircuit size={16} /> Save agent memory</Button>
                <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-3 text-sm text-[var(--ui-text-muted)]">
                  <p className="font-medium text-[var(--ui-text)]">Agent context</p>
                  <p className="mt-1">Short-term and long-term memories are stored separately so earlier interactions stay available for future prompts.</p>
                  <pre className="mt-3 overflow-auto text-xs">{JSON.stringify(agentMemory?.payload || agentMemory, null, 2)}</pre>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default Memory;
