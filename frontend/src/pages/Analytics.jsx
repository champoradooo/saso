import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const PIE_COLORS = { minor: '#f59e0b', moderate: '#f97316', major: '#ef4444' }
const SEV_LABELS = { minor: 'Minor', moderate: 'Moderate', major: 'Major' }

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-border rounded-xl shadow-md px-4 py-3 text-xs space-y-1">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color ?? p.fill }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-medium text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function MetricCard({ label, value, prev, suffix = '' }) {
  const diff = value - (prev ?? value)
  const pct = prev && prev !== 0 ? Math.round((diff / prev) * 100) : 0
  return (
    <Card className="shadow-none border-border/60">
      <CardContent className="p-5">
        <p className="text-xs text-muted-foreground font-medium mb-2">{label}</p>
        <div className="flex items-end justify-between">
          <p className="text-3xl font-bold text-foreground">{value}{suffix}</p>
          {prev !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              diff > 0 ? 'bg-red-50 text-red-600' : diff < 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-muted text-muted-foreground'
            }`}>
              {diff > 0 ? <TrendingUp className="w-3 h-3" /> : diff < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {diff > 0 ? '+' : ''}{pct}%
            </div>
          )}
        </div>
        {prev !== undefined && <p className="text-xs text-muted-foreground mt-1">vs. previous half</p>}
      </CardContent>
    </Card>
  )
}

export default function Analytics() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chartView, setChartView] = useState('bar')

  useEffect(() => {
    api.get('/dashboard/stats/').then(setStats).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="p-6 space-y-5">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      <div className="grid grid-cols-2 gap-4">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-72" />)}</div>
    </div>
  )

  if (!stats) return <div className="p-8 text-sm text-destructive">Failed to load analytics.</div>

  const chart = stats.monthly_chart
  const total = (key) => chart.reduce((s, m) => s + m[key], 0)
  const firstHalf  = chart.slice(0, 6)
  const secondHalf = chart.slice(6)
  const h1Total = (k) => firstHalf.reduce((s, m) => s + m[k], 0)
  const h2Total = (k) => secondHalf.reduce((s, m) => s + m[k], 0)

  const pieData = [
    { name: 'Minor',    value: stats.cases.minor,    key: 'minor' },
    { name: 'Moderate', value: stats.cases.moderate, key: 'moderate' },
    { name: 'Major',    value: stats.cases.major,    key: 'major' },
  ]

  const totalCases = stats.cases.total
  const resolutionRate = totalCases > 0 ? Math.round((stats.cases.resolved / totalCases) * 100) : 0
  const completionRate = stats.students.total > 0 ? Math.round((stats.students.completed / stats.students.total) * 100) : 0

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Violation trends and office performance for {new Date().getFullYear()}</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label="Total Cases YTD" value={totalCases}
          prev={h1Total('minor') + h1Total('moderate') + h1Total('major')} />
        <MetricCard label="Resolution Rate" value={resolutionRate} suffix="%" />
        <MetricCard label="Student Completion" value={completionRate} suffix="%" />
        <MetricCard label="Major Cases" value={stats.cases.major}
          prev={h2Total('major') !== 0 ? h1Total('major') : undefined} />
      </div>

      {/* Main chart */}
      <Card className="shadow-none border-border/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Monthly Violations Breakdown</CardTitle>
            <Tabs value={chartView} onValueChange={setChartView}>
              <TabsList className="h-7">
                <TabsTrigger value="bar" className="text-xs px-3 h-6">Bar</TabsTrigger>
                <TabsTrigger value="line" className="text-xs px-3 h-6">Line</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            {chartView === 'bar' ? (
              <BarChart data={chart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={8} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.90 0.01 255)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'oklch(0.94 0.01 250)' }} />
                <Legend iconSize={8} iconType="circle" formatter={(v) => <span style={{ fontSize: 11 }} className="capitalize">{v}</span>} />
                <Bar dataKey="minor"    name="minor"    fill="#f59e0b" radius={[3,3,0,0]} />
                <Bar dataKey="moderate" name="moderate" fill="#f97316" radius={[3,3,0,0]} />
                <Bar dataKey="major"    name="major"    fill="#ef4444" radius={[3,3,0,0]} />
              </BarChart>
            ) : (
              <LineChart data={chart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.90 0.01 255)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={8} formatter={(v) => <span style={{ fontSize: 11 }} className="capitalize">{v}</span>} />
                <Line type="monotone" dataKey="minor"    name="minor"    stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="moderate" name="moderate" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="major"    name="major"    stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pie + H1 vs H2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Severity donut */}
        <Card className="shadow-none border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Cases by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value">
                    {pieData.map(entry => (
                      <Cell key={entry.key} fill={PIE_COLORS[entry.key]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 flex-1">
                {pieData.map(({ name, value, key }) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[key] }} />
                        {name}
                      </span>
                      <span className="text-muted-foreground">{value} ({totalCases > 0 ? Math.round(value/totalCases*100) : 0}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${totalCases > 0 ? value/totalCases*100 : 0}%`, background: PIE_COLORS[key] }} />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-border/40">
                  <p className="text-xs text-muted-foreground">Resolution rate</p>
                  <p className="text-xl font-bold text-green-600">{resolutionRate}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* H1 vs H2 comparison */}
        <Card className="shadow-none border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">H1 vs H2 Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={[
                  { half: 'Jan–Jun', minor: h1Total('minor'), moderate: h1Total('moderate'), major: h1Total('major') },
                  { half: 'Jul–Dec', minor: h2Total('minor'), moderate: h2Total('moderate'), major: h2Total('major') },
                ]}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                barSize={28}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.90 0.01 255)" />
                <XAxis dataKey="half" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'oklch(0.94 0.01 250)' }} />
                <Legend iconSize={8} iconType="circle" formatter={(v) => <span style={{ fontSize: 11 }} className="capitalize">{v}</span>} />
                <Bar dataKey="minor"    name="minor"    fill="#f59e0b" radius={[3,3,0,0]} stackId="a" />
                <Bar dataKey="moderate" name="moderate" fill="#f97316" radius={[0,0,0,0]} stackId="a" />
                <Bar dataKey="major"    name="major"    fill="#ef4444" radius={[3,3,0,0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>

            {/* Totals */}
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/40">
              {[
                { label: 'First Half Total', val: h1Total('minor') + h1Total('moderate') + h1Total('major') },
                { label: 'Second Half Total', val: h2Total('minor') + h2Total('moderate') + h2Total('major') },
              ].map(({ label, val }) => (
                <div key={label} className="text-center">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold text-foreground">{val}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
