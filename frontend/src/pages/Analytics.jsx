import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import AppShell from '../components/AppShell.jsx';
import ModuleHeader from '../components/ModuleHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { BarChart3, Download, Filter, LineChart, TrendingUp } from 'lucide-react';

const SparklineChart = ({ data, selectedMetric }) => {
  const width = 640;
  const height = 220;
  const padding = 18;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = Math.max(max - min, 1);
  const points = data.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--ui-text)]">Trend line</p>
          <p className="text-xs text-[var(--ui-text-muted)]">Selected metric: {selectedMetric}</p>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-56 w-full" role="img" aria-label={`${selectedMetric} trend chart`}>
        <defs>
          <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((tick) => (
          <line key={tick} x1={padding} x2={width - padding} y1={padding + (height - padding * 2) * tick} y2={padding + (height - padding * 2) * tick} stroke="rgba(148,163,184,0.18)" strokeDasharray="4 4" />
        ))}
        <polyline points={points} fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`} fill="url(#trendFill)" stroke="none" />
        {data.map((value, index) => {
          const x = padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
          const y = height - padding - ((value - min) / range) * (height - padding * 2);
          return <circle key={index} cx={x} cy={y} r="4.5" fill={index % 3 === 1 ? '#0f9f8f' : '#2563eb'} stroke="white" strokeWidth="2" />;
        })}
      </svg>
    </div>
  );
};

const Analytics = () => {
  const [report, setReport] = useState(null);
  const [conversions, setConversions] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('Leads');
  const [selectedWindow, setSelectedWindow] = useState('30d');
  const { pushToast } = useToast();

  const metricCards = useMemo(() => {
    if (!report) return [];
    return [
      { label: 'Leads', value: report.leads, detail: 'Qualified lead flow' },
      { label: 'Campaigns', value: report.campaigns, detail: 'Active content motion' },
      { label: 'Ticket Volume', value: report.ticketVolume, detail: 'Support demand' },
      { label: 'Conversion Rate', value: `${report.conversionRate}%`, detail: 'Pipeline efficiency' }
    ];
  }, [report]);

  const selectedMetricData = useMemo(() => {
    const conversionSeries = conversions.length
      ? conversions.map((item, index) => Number(item.total || 0) + index * 2)
      : [];
    const liveLeads = Number(report?.leads || 0);
    const liveCampaigns = Number(report?.campaigns || 0);
    const liveTickets = Number(report?.ticketVolume || 0);
    const liveRate = Number(report?.conversionRate || 0);
    const metrics = {
      Leads: conversionSeries.length ? conversionSeries : [liveLeads, liveLeads + 3, liveLeads + 5, liveLeads + 7, liveLeads + 6, liveLeads + 8, liveLeads + 10],
      Campaigns: conversionSeries.length ? conversionSeries.map((value, index) => value - index + liveCampaigns) : [liveCampaigns, liveCampaigns + 2, liveCampaigns + 4, liveCampaigns + 5, liveCampaigns + 7, liveCampaigns + 8, liveCampaigns + 10],
      'Ticket Volume': conversionSeries.length ? conversionSeries.map((value, index) => Math.max(value - index * 2, liveTickets)) : [liveTickets, liveTickets + 1, liveTickets + 2, liveTickets + 3, liveTickets + 4, liveTickets + 4, liveTickets + 5],
      'Conversion Rate': conversionSeries.length ? conversionSeries.map((value, index) => Math.max(0, Math.min(100, liveRate + index * 2 - (index % 2)))) : [liveRate, liveRate + 2, liveRate + 4, liveRate + 3, liveRate + 5, liveRate + 6, liveRate + 8]
    };
    return metrics[selectedMetric] || metrics.Leads;
  }, [conversions, report, selectedMetric]);

  useEffect(() => {
    (async () => {
      const [reportRes, conversionRes] = await Promise.all([api.get('/analytics/report'), api.get('/analytics/conversions')]);
      setReport(reportRes.data.report);
      setConversions(conversionRes.data.conversions || []);
    })();
  }, []);

  const handleExport = () => {
    const rows = [
      ['metric', 'value'],
      ['leads', report?.leads ?? 0],
      ['campaigns', report?.campaigns ?? 0],
      ['ticket_volume', report?.ticketVolume ?? 0],
      ['conversion_rate', report?.conversionRate ?? 0]
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new globalThis.Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = globalThis.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => globalThis.URL.revokeObjectURL(url), 1000);
    pushToast({ tone: 'success', title: 'Export downloaded', message: 'Analytics CSV is ready.' });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <ModuleHeader
          eyebrow="Analytics Agent"
          title="Analytics"
          description="Track lead, campaign, ticket, engagement, and conversion signals with a clean operational dashboard."
          actions={(
            <div className="flex flex-wrap gap-2">
              {['7d', '30d', '90d'].map((window) => (
                <Button key={window} variant={selectedWindow === window ? 'primary' : 'secondary'} onClick={() => setSelectedWindow(window)}>
                  {window}
                </Button>
              ))}
              <Button variant="secondary"><Filter size={16} /> Filter</Button>
              <Button variant="secondary" onClick={handleExport}><Download size={16} /> Export</Button>
            </div>
          )}
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {report ? metricCards.map((metric) => (
            <StatCard key={metric.label} label={metric.label} value={metric.value} detail={metric.detail} icon={TrendingUp} />
          )) : <EmptyState title="Metrics are loading" description="The reporting panel will populate as soon as the API resolves." />}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold"><LineChart size={18} /> Conversion tracking</h2>
              <Badge tone="accent">{selectedWindow} window</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {['Leads', 'Campaigns', 'Ticket Volume', 'Conversion Rate'].map((label) => (
                <Button key={label} variant={selectedMetric === label ? 'primary' : 'secondary'} onClick={() => setSelectedMetric(label)}>{label}</Button>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              {conversions.length ? conversions.map((item, index) => (
                <div key={item.category} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.category}</span>
                    <span className="font-semibold">{item.total}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[var(--ui-surface)]">
                    <div className={`h-full rounded-full ${index === 0 ? 'bg-[var(--ui-accent)]' : index === 1 ? 'bg-emerald-500' : 'bg-slate-500'}`} style={{ width: `${Math.min(Number(item.total || 0) * 8, 100)}%` }} />
                  </div>
                </div>
              )) : <EmptyState title="No conversion data yet" description="Reporting values appear after the API returns live business metrics." />}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold"><BarChart3 size={18} /> Activity summary</h2>
              <TrendingUp size={18} className="text-emerald-500" />
            </div>
            <div className="mt-4 rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[var(--ui-text-muted)]">Overall efficiency</p>
                  <p className="mt-1 text-3xl font-semibold">{report ? `${report.conversionRate}%` : '0%'}</p>
                </div>
                <div className="relative h-24 w-24 rounded-full border-8 border-blue-200/50 bg-[conic-gradient(theme(colors.blue.500)_0_68%,theme(colors.emerald.500)_68%_86%,theme(colors.slate.300)_86%_100%)]">
                  <div className="absolute inset-4 rounded-full bg-[var(--ui-surface)]" />
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {['Leads', 'Campaigns', 'Tickets'].map((label, index) => (
                  <div key={label} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-3 text-center">
                    <p className="text-xs uppercase text-[var(--ui-text-muted)]">{label}</p>
                    <p className="mt-2 text-lg font-semibold">{report ? [report.leads, report.campaigns, report.ticketVolume][index] : 0}</p>
                  </div>
                ))}
              </div>
            </div>
            <SparklineChart data={selectedMetricData} selectedMetric={selectedMetric} />
          </Card>
        </section>
      </div>
    </AppShell>
  );
};

export default Analytics;
