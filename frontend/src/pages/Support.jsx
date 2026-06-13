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
import { LifeBuoy, MessageSquareText, Ticket, Clock3, Brain, RefreshCcw, ShieldCheck } from 'lucide-react';

const Support = () => {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [response, setResponse] = useState('');
  const [faqs, setFaqs] = useState([]);
  const [faqQuery, setFaqQuery] = useState('');
  const { pushToast } = useToast();

  const load = async () => {
    const [{ data: ticketData }, { data: faqData }] = await Promise.all([
      api.get('/support/tickets'),
      api.get('/support/faq')
    ]);
    setTickets(ticketData.tickets || []);
    setFaqs(faqData.faqs || []);
  };

  useEffect(() => { load(); }, []);

  const send = async () => {
    const { data } = await api.post('/support/chat', { message, history });
    const reply = data.response.response || data.response;
    setResponse(reply);
    setHistory((current) => [...current, { role: 'user', content: message }, { role: 'assistant', content: reply }]);
    setMessage('');
    pushToast({ tone: 'info', title: 'Support reply generated', message: 'Conversation updated with AI context.' });
  };

  const createTicket = async () => {
    await api.post('/support/tickets', { subject: message || 'New support ticket', customerName: 'Customer', history });
    await load();
    pushToast({ tone: 'success', title: 'Ticket created', message: 'Support issue persisted successfully.' });
  };

  const filteredFaqs = faqs.filter((faq) => `${faq.question} ${faq.answer}`.toLowerCase().includes(faqQuery.toLowerCase()));

  return (
    <AppShell>
      <div className="space-y-6">
        <ModuleHeader
          eyebrow="Support Agent"
          title="Support console"
          description="Chat with the AI support layer, create tickets, and review ticket history in one workspace."
          actions={<Badge tone="accent"><LifeBuoy size={14} className="mr-2 inline" /> open, pending, resolved</Badge>}
        />

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <Card className="space-y-4">
            <div className="min-h-[20rem] rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
              {history.length ? history.map((item, index) => (
                <div key={index} className="mb-3 rounded-2xl bg-[var(--ui-surface)] px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">{item.role}</p>
                  <p className="text-sm">{item.content}</p>
                </div>
              )) : <EmptyState title="Conversation is empty" description="Start a support message to see the live chat layout in action." />}
              {response ? <p className="mt-4 text-sm font-medium">{response}</p> : null}
            </div>
            <div className="flex gap-2">
              <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ask support..." />
              <Button type="button" variant="primary" onClick={send}><MessageSquareText size={16} /> Chat</Button>
              <Button type="button" variant="secondary" onClick={createTicket}><Ticket size={16} /> Ticket</Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Card><p className="flex items-center gap-2 text-sm font-medium"><Brain size={16} /> AI tone</p><p className="mt-2 text-sm text-[var(--ui-text-muted)]">Replies are short and practical.</p></Card>
              <Card><p className="flex items-center gap-2 text-sm font-medium"><Clock3 size={16} /> Response loop</p><p className="mt-2 text-sm text-[var(--ui-text-muted)]">History stays with the conversation.</p></Card>
              <Card><p className="flex items-center gap-2 text-sm font-medium"><ShieldCheck size={16} /> Resolution</p><p className="mt-2 text-sm text-[var(--ui-text-muted)]">Clear ownership and next steps.</p></Card>
              <Card><p className="flex items-center gap-2 text-sm font-medium"><RefreshCcw size={16} /> Follow-through</p><p className="mt-2 text-sm text-[var(--ui-text-muted)]">Escalation language stays consistent.</p></Card>
            </div>
            <Card className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold">FAQ</h2>
                <Input value={faqQuery} onChange={(e) => setFaqQuery(e.target.value)} placeholder="Search FAQs..." className="max-w-xs" />
              </div>
              <div className="grid gap-2">
                {filteredFaqs.length ? filteredFaqs.map((faq) => (
                  <details key={faq.id} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-3">
                    <summary className="cursor-pointer font-medium">{faq.question}</summary>
                    <p className="mt-2 text-sm text-[var(--ui-text-muted)]">{faq.answer}</p>
                  </details>
                )) : <EmptyState title="No matching FAQs" description="Try another keyword to narrow the support knowledge base." />}
              </div>
            </Card>
          </Card>

          <aside className="space-y-4">
            <Card>
              <h2 className="font-semibold">Tickets</h2>
              <div className="mt-4 space-y-3">
                {tickets.length ? tickets.map((ticket) => (
                  <article key={ticket.id} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-3">
                    <p className="font-medium">{ticket.subject}</p>
                    <p className="text-sm text-[var(--ui-text-muted)]">{ticket.status}</p>
                  </article>
                )) : <EmptyState title="No tickets" description="Create a ticket from the chat composer to populate this lane." />}
              </div>
            </Card>
          </aside>
        </section>
      </div>
    </AppShell>
  );
};

export default Support;
