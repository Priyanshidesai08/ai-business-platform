import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import AppShell from '../components/AppShell.jsx';
import ModuleHeader from '../components/ModuleHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import { Activity, BarChart3, BrainCircuit, LineChart, TrendingUp } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';

const TrendChart = ({ data, title, accent = '#2563eb' }) => {
  const width = 680;
  const height = 220;
  const padding = 18;
  const max = Math.max(...data.map((item) => item.value), 1);
  const points = data.map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
    const y = height - padding - ((item.value / max) * (height - padding * 2));
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-[var(--ui-text-muted)]">Trend detection over recent workflow snapshots.</p>
        </div>
        <Badge tone="accent">live trends</Badge>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-56 w-full" role="img" aria-label={title}>
        <polyline points={points} fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((item, index) => {
          const x = padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
          const y = height - padding - ((item.value / max) * (height - padding * 2));
          return <circle key={item.label} cx={x} cy={y} r="5" fill={accent} stroke="white" strokeWidth="2" />;
        })}
      </svg>
    </div>
  );
};

const BusinessInsights = () => {
  const [insights, setInsights] = useState(null);
  const [trends, setTrends] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const { pushToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, trendsRes, predictionRes] = await Promise.all([
        api.get('/insights'),
        api.get('/insights/trends'),
        api.post('/insights/predict', { horizon: '30d' })
      ]);
      setInsights(summaryRes.data.insights);
      setTrends(trendsRes.data.trends || []);
      setPrediction(predictionRes.data.prediction);
    } catch (error) {
      pushToast({ tone: 'danger', title: 'Insights unavailable', message: error.response?.data?.message || error.message || 'Could not load insights.' });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => { load(); }, [load]);

  const cards = useMemo(() => {
    if (!insights) return [];
    return [
      { label: 'Lead Conversion', value: `${insights.metrics.leadConversion}%`, detail: 'Predicts lead movement', icon: TrendingUp },
      { label: 'Campaign Success', value: `${insights.metrics.campaignSuccess}%`, detail: 'Measures active campaign health', icon: BarChart3 },
      { label: 'Support Resolution', value: `${insights.metrics.supportResolution}%`, detail: 'Ticket resolution speed', icon: Activity },
      { label: 'Workflow Efficiency', value: `${insights.metrics.workflowEfficiency}%`, detail: 'Automation throughput', icon: BrainCircuit }
    ];
  }, [insights]);

  const trendData = useMemo(() => {
    if (trends.length) {
      return trends.slice(0, 6).map((item, index) => ({ label: item.horizon || `Item ${index + 1}`, value: Number(item.confidence || 0) * 100 }));
    }

    if (!insights) {
      return [
        { label: 'Lead', value: 18 },
        { label: 'Campaign', value: 24 },
        { label: 'Support', value: 28 },
        { label: 'Workflow', value: 32 },
        { label: 'Efficiency', value: 38 },
        { label: 'Prediction', value: 44 }
      ];
    }

    return [
      { label: 'Lead', value: Number(insights.metrics.leadConversion || 0) },
      { label: 'Campaign', value: Number(insights.metrics.campaignSuccess || 0) },
      { label: 'Support', value: Number(insights.metrics.supportResolution || 0) },
      { label: 'Workflow', value: Number(insights.metrics.workflowEfficiency || 0) },
      { label: 'Forecast', value: Number(prediction?.confidence || 0) * 100 },
      { label: 'Signal', value: Number(insights.metrics.leadConversion || 0) + 6 }
    ];
  }, [insights, prediction, trends]);
  const comparisonData = useMemo(() => [
    { label: 'Current', value: Number(prediction?.forecast?.predictedWorkflowEfficiency || 0), accent: '#2563eb' },
    { label: 'Lead', value: Number(prediction?.forecast?.predictedLeadConversion || 0), accent: '#0f9f8f' },
    { label: 'Campaign', value: Number(prediction?.forecast?.predictedCampaignSuccess || 0), accent: '#f59e0b' },
    { label: 'Support', value: Number(prediction?.forecast?.predictedSupportResolution || 0), accent: '#16a34a' }
  ], [prediction]);

  return (
    <AppShell>
      <div className="space-y-6">
        <ModuleHeader
          eyebrow="Business insights"
          title="Insights Dashboard"
          description="Forecast conversion, inspect trend signals, and review recommendations generated from workflow performance."
          actions={<Badge tone="accent"><LineChart size={14} className="mr-2 inline" /> prediction ready</Badge>}
        />

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map((card) => <StatCard key={card.label} {...card} />)}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <Card className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">Prediction forecast</h2>
                  <Badge tone="success">confidence {(prediction?.confidence ?? 0).toFixed(2)}</Badge>
                </div>
                {prediction ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">Lead conversion</p>
                      <p className="mt-2 text-2xl font-semibold">{prediction.forecast.predictedLeadConversion}%</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">Campaign success</p>
                      <p className="mt-2 text-2xl font-semibold">{prediction.forecast.predictedCampaignSuccess}%</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">Support resolution</p>
                      <p className="mt-2 text-2xl font-semibold">{prediction.forecast.predictedSupportResolution}%</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">Workflow efficiency</p>
                      <p className="mt-2 text-2xl font-semibold">{prediction.forecast.predictedWorkflowEfficiency}%</p>
                    </div>
                  </div>
                ) : (
                  <EmptyState title="No prediction yet" description="Prediction output will appear once the insights service runs." />
                )}
                <TrendChart data={trendData} title="Confidence trend" />
              </Card>

              <div className="space-y-6">
                <Card className="space-y-4">
                  <h2 className="text-lg font-semibold">Recommendations</h2>
                  {insights?.recommendations?.length ? (
                    <div className="space-y-2">
                      {insights.recommendations.map((item) => (
                        <div key={item} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4 text-sm text-[var(--ui-text)]">{item}</div>
                      ))}
                    </div>
                  ) : <EmptyState title="No recommendations" description="Healthy metrics keep the recommendations panel quiet." />}
                </Card>

                <Card className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">Trend snapshots</h2>
                    <Button variant="secondary" onClick={load}>Refresh</Button>
                  </div>
                  {trends.length ? (
                    <div className="space-y-2">
                      {trends.slice(0, 5).map((item) => (
                        <div key={item.id} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{item.horizon}</span>
                            <Badge tone="accent">{Number(item.confidence || 0).toFixed(2)}</Badge>
                          </div>
                          <p className="mt-2 text-xs text-[var(--ui-text-muted)]">Forecast captured at {new Date(item.created_at).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  ) : <EmptyState title="No trend data" description="Predictions will populate this history after the first run." />}
                </Card>

                <Card className="space-y-4">
                  <h2 className="text-lg font-semibold">Metric comparison</h2>
                  <div className="space-y-3">
                    {comparisonData.map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-[var(--ui-text-muted)]">
                          <span>{item.label}</span>
                          <span>{item.value.toFixed(2)}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--ui-surface-muted)]">
                          <div className="h-2 rounded-full" style={{ width: `${Math.min(item.value, 100)}%`, backgroundColor: item.accent }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
};

export default BusinessInsights;
