import { BarChart3, FileText, Search, TrendingUp, Shield, Zap } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { ScoreMeter } from "@/components/ScoreMeter";
import { useDocumentStore } from "@/stores/documentStore";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

const historyData = [
  { name: "Mon", score: 72, queries: 12 },
  { name: "Tue", score: 78, queries: 18 },
  { name: "Wed", score: 65, queries: 8 },
  { name: "Thu", score: 82, queries: 22 },
  { name: "Fri", score: 88, queries: 15 },
  { name: "Sat", score: 91, queries: 10 },
  { name: "Sun", score: 85, queries: 6 },
];

const coverageDist = [
  { name: "High (>80%)", value: 42, color: "hsl(152, 60%, 48%)" },
  { name: "Medium (50-80%)", value: 35, color: "hsl(38, 92%, 58%)" },
  { name: "Low (<50%)", value: 23, color: "hsl(0, 72%, 55%)" },
];

const chunkQuality = [
  { name: "Relevant", count: 156 },
  { name: "Partial", count: 89 },
  { name: "Noise", count: 34 },
  { name: "Missing", count: 21 },
];

export default function AnalyticsDashboard() {
  const { chunks, summaries, auditResults, fileName } = useDocumentStore();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Analytics Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of document intelligence quality metrics
        </p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Documents Processed"
          value={fileName ? 1 : 0}
          change="+1 today"
          trend="up"
          icon={<FileText className="w-5 h-5" />}
        />
        <MetricCard
          label="Total Chunks"
          value={chunks.length || 300}
          change="+45 today"
          trend="up"
          icon={<Zap className="w-5 h-5" />}
        />
        <MetricCard
          label="Queries Audited"
          value={auditResults ? 1 : 91}
          change="+12 this week"
          trend="up"
          icon={<Search className="w-5 h-5" />}
        />
        <MetricCard
          label="Avg Integrity"
          value={auditResults?.integrityScore || 82}
          change="+3.2 pts"
          trend="up"
          icon={<Shield className="w-5 h-5" />}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Integrity trend */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Integrity Score Trend
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={historyData}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(174, 72%, 46%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(174, 72%, 46%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(215, 12%, 52%)", fontSize: 11 }} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "hsl(215, 12%, 52%)", fontSize: 11 }} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(220, 18%, 10%)",
                  border: "1px solid hsl(220, 14%, 18%)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "hsl(210, 20%, 92%)"
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="hsl(174, 72%, 46%)"
                strokeWidth={2}
                fill="url(#scoreGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Coverage distribution */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-medium text-foreground mb-4">Coverage Distribution</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie
                  data={coverageDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {coverageDist.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {coverageDist.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ background: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                  <span className="text-xs font-mono text-foreground ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chunk quality */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card lg:col-span-2">
          <h3 className="text-sm font-medium text-foreground mb-4">Chunk Quality Analysis</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chunkQuality}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(215, 12%, 52%)", fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: "hsl(215, 12%, 52%)", fontSize: 11 }} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(220, 18%, 10%)",
                  border: "1px solid hsl(220, 14%, 18%)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "hsl(210, 20%, 92%)"
                }}
              />
              <Bar dataKey="count" fill="hsl(174, 72%, 46%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Score meters */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-medium text-foreground mb-4">Quality Scores</h3>
          <div className="grid grid-cols-2 gap-4">
            <ScoreMeter score={auditResults?.integrityScore || 82} label="Integrity" />
            <ScoreMeter score={76} label="Coverage" />
            <ScoreMeter score={91} label="Precision" />
            <ScoreMeter score={68} label="Recall" />
          </div>
        </div>
      </div>
    </div>
  );
}
