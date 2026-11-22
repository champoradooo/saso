import { useEffect, useState } from 'react'
import { api } from '../api/client'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  Users,
  ShieldAlert,
  AlertTriangle,
  CalendarCheck,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */

const SEVERITY_BADGE = {
  minor:
    'bg-amber-100 text-amber-700 border-amber-200',

  moderate:
    'bg-orange-100 text-orange-700 border-orange-200',

  major:
    'bg-red-100 text-red-700 border-red-200',
}

const STATUS_BADGE = {
  pending:
    'bg-yellow-50 text-yellow-700 border-yellow-200',

  under_review:
    'bg-emerald-50 text-emerald-700 border-emerald-200',

  resolved:
    'bg-green-50 text-green-700 border-green-200',
}

const STATUS_LABEL = {
  pending: 'Pending',
  under_review: 'Under Review',
  resolved: 'Resolved',
}

const PIE_COLORS = {
  minor: '#f59e0b',
  moderate: '#f97316',
  major: '#ef4444',
}


/* ─────────────────────────────────────────
   CHART TOOLTIP
───────────────────────────────────────── */

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="bg-white border border-border rounded-xl shadow-md px-4 py-3 text-xs space-y-1">

      <p className="font-semibold text-foreground mb-1.5">
        {label}
      </p>

      {payload.map((p) => (
        <div
          key={p.name}
          className="flex items-center gap-2"
        >

          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{
              background: p.fill ?? p.color,
            }}
          />

          <span className="text-muted-foreground capitalize">
            {p.name}:
          </span>

          <span className="font-medium text-foreground">
            {p.value}
          </span>

        </div>
      ))}

    </div>
  )
}


/* ─────────────────────────────────────────
   ANALYTICS METRIC CARD
───────────────────────────────────────── */

function AnalyticsMetricCard({
  label,
  value,
  prev,
  suffix = '',
}) {
  const diff = value - (prev ?? value)

  const pct =
    prev && prev !== 0
      ? Math.round((diff / prev) * 100)
      : 0

  return (
    <Card className="shadow-none border-border/60">

      <CardContent className="p-5">

        <p className="text-xs text-muted-foreground font-medium mb-2">
          {label}
        </p>

        <div className="flex items-end justify-between">

          <p className="text-3xl font-bold text-foreground">
            {value}
            {suffix}
          </p>

          {prev !== undefined && (
            <div
              className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                diff > 0
                  ? 'bg-red-50 text-red-600'
                  : diff < 0
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-muted text-muted-foreground'
              }`}
            >

              {diff > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : diff < 0 ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <Minus className="w-3 h-3" />
              )}

              {diff > 0 ? '+' : ''}
              {pct}%

            </div>
          )}

        </div>

        {prev !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">
            vs. previous half
          </p>
        )}

      </CardContent>

    </Card>
  )
}


/* ─────────────────────────────────────────
   ANALYTICS SECTION
───────────────────────────────────────── */

function AnalyticsSection({
  students,
  cases,
  monthly_chart,
}) {
  const [chartView, setChartView] = useState('bar')

  const chart = monthly_chart ?? []

  const firstHalf = chart.slice(0, 6)

  const secondHalf = chart.slice(6)

  const h1Total = (key) =>
    firstHalf.reduce(
      (sum, month) => sum + month[key],
      0
    )

  const h2Total = (key) =>
    secondHalf.reduce(
      (sum, month) => sum + month[key],
      0
    )

  const pieData = [
    {
      name: 'Minor',
      value: cases.minor,
      key: 'minor',
    },
    {
      name: 'Moderate',
      value: cases.moderate,
      key: 'moderate',
    },
    {
      name: 'Major',
      value: cases.major,
      key: 'major',
    },
  ]

  const totalCases = cases.total

  const resolutionRate =
    totalCases > 0
      ? Math.round(
          (cases.resolved / totalCases) * 100
        )
      : 0

  /*
   * Clearance calculations have intentionally
   * been removed from the dashboard display.
   */

  return (
    <div className="space-y-4">

      {/* Analytics Header */}

      <div className="flex items-end justify-between gap-4">

        <div>

          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Analytics
          </p>

          <h2 className="text-lg font-bold text-foreground">
            Consolidated performance view
          </h2>

        </div>

      </div>


      {/* Analytics Cards */}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

        <AnalyticsMetricCard
          label="Total Cases YTD"
          value={totalCases}
          prev={
            h1Total('minor') +
            h1Total('moderate') +
            h1Total('major')
          }
        />

        <AnalyticsMetricCard
          label="Resolution Rate"
          value={resolutionRate}
          suffix="%"
        />

        <AnalyticsMetricCard
          label="Major Cases"
          value={cases.major}
          prev={
            h2Total('major') !== 0
              ? h1Total('major')
              : undefined
          }
        />

      </div>


      {/* Charts */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Monthly Violations */}

        <Card className="shadow-none border-border/60">

          <CardHeader className="pb-2">

            <div className="flex items-center justify-between">

              <CardTitle className="text-sm font-semibold">
                Monthly Violations Breakdown
              </CardTitle>

              <Tabs
                value={chartView}
                onValueChange={setChartView}
              >

                <TabsList className="h-7">

                  <TabsTrigger
                    value="bar"
                    className="text-xs px-3 h-6"
                  >
                    Bar
                  </TabsTrigger>

                  <TabsTrigger
                    value="line"
                    className="text-xs px-3 h-6"
                  >
                    Line
                  </TabsTrigger>

                </TabsList>

              </Tabs>

            </div>

          </CardHeader>


          <CardContent>

            <ResponsiveContainer
              width="100%"
              height={260}
            >

              {chartView === 'bar' ? (

                <BarChart
                  data={chart}
                  margin={{
                    top: 4,
                    right: 4,
                    left: -20,
                    bottom: 0,
                  }}
                  barSize={8}
                  barGap={2}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="oklch(0.90 0.01 255)"
                  />

                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />

                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{
                      fill: 'oklch(0.94 0.01 250)',
                    }}
                  />

                  <Legend
                    iconSize={8}
                    iconType="circle"
                    formatter={(v) => (
                      <span
                        style={{ fontSize: 11 }}
                        className="capitalize"
                      >
                        {v}
                      </span>
                    )}
                  />

                  <Bar
                    dataKey="minor"
                    name="minor"
                    fill={PIE_COLORS.minor}
                    radius={[3, 3, 0, 0]}
                  />

                  <Bar
                    dataKey="moderate"
                    name="moderate"
                    fill={PIE_COLORS.moderate}
                    radius={[3, 3, 0, 0]}
                  />

                  <Bar
                    dataKey="major"
                    name="major"
                    fill={PIE_COLORS.major}
                    radius={[3, 3, 0, 0]}
                  />

                </BarChart>

              ) : (

                <LineChart
                  data={chart}
                  margin={{
                    top: 4,
                    right: 4,
                    left: -20,
                    bottom: 0,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="oklch(0.90 0.01 255)"
                  />

                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />

                  <Tooltip
                    content={<ChartTooltip />}
                  />

                  <Legend
                    iconSize={8}
                    formatter={(v) => (
                      <span
                        style={{ fontSize: 11 }}
                        className="capitalize"
                      >
                        {v}
                      </span>
                    )}
                  />

                  <Line
                    type="monotone"
                    dataKey="minor"
                    name="minor"
                    stroke={PIE_COLORS.minor}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="moderate"
                    name="moderate"
                    stroke={PIE_COLORS.moderate}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="major"
                    name="major"
                    stroke={PIE_COLORS.major}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />

                </LineChart>

              )}

            </ResponsiveContainer>

          </CardContent>

        </Card>


        {/* Cases by Severity */}

        <Card className="shadow-none border-border/60">

          <CardHeader className="pb-2">

            <CardTitle className="text-sm font-semibold">
              Cases by Severity
            </CardTitle>

          </CardHeader>

          <CardContent>

            <div className="flex items-center gap-6">

              <ResponsiveContainer
                width={180}
                height={180}
              >

                <PieChart>

                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >

                    {pieData.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={PIE_COLORS[entry.key]}
                      />
                    ))}

                  </Pie>

                  <Tooltip
                    content={<ChartTooltip />}
                  />

                </PieChart>

              </ResponsiveContainer>


              <div className="space-y-3 flex-1">

                {pieData.map(
                  ({ name, value, key }) => (

                    <div key={key}>

                      <div className="flex justify-between text-xs mb-1">

                        <span className="flex items-center gap-1.5 font-medium text-foreground">

                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{
                              background:
                                PIE_COLORS[key],
                            }}
                          />

                          {name}

                        </span>

                        <span className="text-muted-foreground">

                          {value} (
                          {totalCases > 0
                            ? Math.round(
                                (value /
                                  totalCases) *
                                  100
                              )
                            : 0}
                          %)

                        </span>

                      </div>

                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">

                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${
                              totalCases > 0
                                ? (value /
                                    totalCases) *
                                  100
                                : 0
                            }%`,
                            background:
                              PIE_COLORS[key],
                          }}
                        />

                      </div>

                    </div>

                  )
                )}

                <div className="pt-2 border-t border-border/40">

                  <p className="text-xs text-muted-foreground">
                    Resolution rate
                  </p>

                  <p className="text-xl font-bold text-green-600">
                    {resolutionRate}%
                  </p>

                </div>

              </div>

            </div>

          </CardContent>

        </Card>

      </div>


      {/* H1 VS H2 */}

      <Card className="shadow-none border-border/60">

        <CardHeader className="pb-2">

          <CardTitle className="text-sm font-semibold">
            H1 vs H2 Comparison
          </CardTitle>

        </CardHeader>

        <CardContent>

          <ResponsiveContainer
            width="100%"
            height={200}
          >

            <BarChart
              data={[
                {
                  half: 'Jan–Jun',
                  minor: h1Total('minor'),
                  moderate: h1Total('moderate'),
                  major: h1Total('major'),
                },
                {
                  half: 'Jul–Dec',
                  minor: h2Total('minor'),
                  moderate: h2Total('moderate'),
                  major: h2Total('major'),
                },
              ]}
              margin={{
                top: 4,
                right: 4,
                left: -20,
                bottom: 0,
              }}
              barSize={28}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="oklch(0.90 0.01 255)"
              />

              <XAxis
                dataKey="half"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />

              <Tooltip
                content={<ChartTooltip />}
                cursor={{
                  fill: 'oklch(0.94 0.01 250)',
                }}
              />

              <Legend
                iconSize={8}
                iconType="circle"
                formatter={(v) => (
                  <span
                    style={{ fontSize: 11 }}
                    className="capitalize"
                  >
                    {v}
                  </span>
                )}
              />

              <Bar
                dataKey="minor"
                name="minor"
                fill={PIE_COLORS.minor}
                radius={[3, 3, 0, 0]}
                stackId="a"
              />

              <Bar
                dataKey="moderate"
                name="moderate"
                fill={PIE_COLORS.moderate}
                radius={[0, 0, 0, 0]}
                stackId="a"
              />

              <Bar
                dataKey="major"
                name="major"
                fill={PIE_COLORS.major}
                radius={[3, 3, 0, 0]}
                stackId="a"
              />

            </BarChart>

          </ResponsiveContainer>


          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/40">

            {[
              {
                label: 'First Half Total',
                val:
                  h1Total('minor') +
                  h1Total('moderate') +
                  h1Total('major'),
              },
              {
                label: 'Second Half Total',
                val:
                  h2Total('minor') +
                  h2Total('moderate') +
                  h2Total('major'),
              },
            ].map(({ label, val }) => (

              <div
                key={label}
                className="text-center"
              >

                <p className="text-xs text-muted-foreground">
                  {label}
                </p>

                <p className="text-2xl font-bold text-foreground">
                  {val}
                </p>

              </div>

            ))}

          </div>

        </CardContent>

      </Card>

    </div>
  )
}


/* ─────────────────────────────────────────
   DATE FORMATTER
───────────────────────────────────────── */

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString(
    'en-PH',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  )
}


/* ─────────────────────────────────────────
   STAT CARD
───────────────────────────────────────── */

function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
  trend,
}) {
  return (
    <Card className="shadow-none border-border/60">

      <CardContent className="p-5">

        <div className="flex items-center justify-between mb-3">

          <p className="text-sm text-muted-foreground font-medium">
            {label}
          </p>

          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconClass}`}
          >
            <Icon className="w-4.5 h-4.5" />
          </div>

        </div>

        <p className="text-3xl font-bold tracking-tight text-foreground">
          {value ?? '—'}
        </p>

        {trend && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend}
          </p>
        )}

      </CardContent>

    </Card>
  )
}


/* ─────────────────────────────────────────
   LOADING SKELETON
───────────────────────────────────────── */

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">

      <div className="h-8 w-48 bg-muted rounded-lg" />

      <div className="grid grid-cols-3 gap-4">

        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-28 bg-muted rounded-xl"
          />
        ))}

      </div>

      <div className="grid grid-cols-6 gap-4">

        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-muted rounded-xl"
          />
        ))}

      </div>

      <div className="h-72 bg-muted rounded-xl" />

    </div>
  )
}


/* ─────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────── */

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    api
      .get('/dashboard/stats/')
      .then(setStats)
      .finally(() => setLoading(false))

  }, [])


  if (loading) {
    return <DashboardSkeleton />
  }


  if (!stats) {

    return (
      <div className="p-8">

        <p className="text-destructive text-sm">
          Failed to load dashboard. Make sure the backend is running.
        </p>

      </div>
    )
  }


  const {
    students,
    cases,
    recent_cases,
    upcoming_activities,
    monthly_chart,
  } = stats


  const today =
    new Date().toLocaleDateString(
      'en-PH',
      {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    )


  return (
    <div className="p-6 space-y-6 max-w-screen-2xl">

      {/* ─────────────────────────────────
          HEADER
      ───────────────────────────────── */}

      <div className="flex items-start justify-between">

        <div>

          <h1 className="text-2xl font-bold text-foreground">
            Dashboard
          </h1>

          <p className="text-sm text-muted-foreground mt-0.5">
            {today}
          </p>

        </div>

        <Badge
          variant="outline"
          className="text-xs font-normal px-3 py-1.5 rounded-full"
        >
          Academic Year 2025–2026
        </Badge>

      </div>


      {/* ─────────────────────────────────
          STUDENT OVERVIEW
      ───────────────────────────────── */}

      <div>

        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Students
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* ONLY TOTAL NUMBER OF STUDENTS */}

          <StatCard
            label="Total Number of Students"
            value={students.total}
            icon={Users}
            iconClass="bg-emerald-100 text-emerald-600"
            trend="Currently enrolled students"
          />

        </div>

      </div>


      {/* ─────────────────────────────────
          CASES OVERVIEW
      ───────────────────────────────── */}

      <div>

        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Disciplinary Cases
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">

          {[
            {
              label: 'Total',
              value: cases.total,
              icon: ShieldAlert,
              cls: 'bg-slate-100 text-slate-600',
            },

            {
              label: 'Pending',
              value: cases.pending,
              icon: TrendingUp,
              cls: 'bg-yellow-100 text-yellow-600',
            },

            {
              label: 'Under Review',
              value: cases.under_review,
              icon: AlertTriangle,
              cls: 'bg-emerald-100 text-emerald-600',
            },

            {
              label: 'Resolved',
              value: cases.resolved,
              icon: CalendarCheck,
              cls: 'bg-green-100 text-green-600',
            },

            {
              label: 'Minor',
              value: cases.minor,
              icon: AlertTriangle,
              cls: 'bg-amber-100 text-amber-600',
            },

            {
              label: 'Major',
              value: cases.major,
              icon: ShieldAlert,
              cls: 'bg-red-100 text-red-600',
            },
          ].map(
            ({
              label,
              value,
              icon,
              cls,
            }) => (

              <Card
                key={label}
                className="shadow-none border-border/60"
              >

                <CardContent className="p-4">

                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${cls}`}
                  >

                    {(() => {
                      const I = icon
                      return (
                        <I className="w-4 h-4" />
                      )
                    })()}

                  </div>

                  <p className="text-2xl font-bold text-foreground">
                    {value}
                  </p>

                  <p className="text-xs text-muted-foreground mt-0.5">
                    {label}
                  </p>

                </CardContent>

              </Card>

            )
          )}

        </div>

      </div>


      {/* ─────────────────────────────────
          ACTIVITIES + RECENT CASES
      ───────────────────────────────── */}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* UPCOMING ACTIVITIES */}

        <Card className="lg:col-span-2 shadow-none border-border/60">

          <CardHeader className="pb-3">

            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">

              <CalendarCheck className="w-4 h-4 text-primary" />

              Upcoming Activities

            </CardTitle>

          </CardHeader>


          <CardContent className="pt-0 space-y-3">

            {upcoming_activities.length === 0 ? (

              <p className="text-sm text-muted-foreground">
                No upcoming activities.
              </p>

            ) : (

              upcoming_activities.map(
                (a, idx) => {

                  const d = new Date(
                    a.event_date
                  )

                  return (

                    <div key={a.id}>

                      {idx > 0 && (
                        <Separator className="my-3" />
                      )}

                      <div className="flex gap-3 items-start">

                        <div className="shrink-0 w-11 rounded-xl bg-primary/10 text-center py-1.5">

                          <p className="text-[10px] font-semibold text-primary uppercase">
                            {d.toLocaleDateString(
                              'en-PH',
                              {
                                month: 'short',
                              }
                            )}
                          </p>

                          <p className="text-lg font-bold text-primary leading-tight">
                            {d.getDate()}
                          </p>

                        </div>


                        <div className="min-w-0">

                          <p className="text-sm font-medium text-foreground leading-tight truncate">
                            {a.title}
                          </p>

                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {a.location || 'TBA'}
                          </p>

                        </div>

                      </div>

                    </div>

                  )
                }
              )

            )}

          </CardContent>

        </Card>


        {/* RECENT DISCIPLINARY CASES */}

        <Card className="lg:col-span-3 shadow-none border-border/60">

          <CardHeader className="pb-0">

            <CardTitle className="text-sm font-semibold text-foreground">
              Recent Disciplinary Cases
            </CardTitle>

          </CardHeader>


          <CardContent className="pt-4 px-0">

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead>

                  <tr className="border-b border-border/60">

                    {[
                      'Case #',
                      'Student',
                      'Violation',
                      'Severity',
                      'Status',
                      'Date',
                    ].map((h) => (

                      <th
                        key={h}
                        className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3"
                      >
                        {h}
                      </th>

                    ))}

                  </tr>

                </thead>


                <tbody>

                  {recent_cases.length === 0 ? (

                    <tr>

                      <td
                        colSpan={6}
                        className="px-6 py-10 text-center text-muted-foreground text-sm"
                      >
                        No cases recorded yet.
                      </td>

                    </tr>

                  ) : (

                    recent_cases.map(
                      (c, idx) => (

                        <tr
                          key={c.id}
                          className={`border-b border-border/40 transition-colors hover:bg-muted/40 ${
                            idx % 2 === 0
                              ? ''
                              : 'bg-muted/20'
                          }`}
                        >

                          <td className="px-6 py-3.5 font-mono text-xs text-muted-foreground">
                            {c.case_number}
                          </td>


                          <td className="px-6 py-3.5">

                            <p className="font-medium text-foreground">
                              {c.student_name}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {c.student_id}
                            </p>

                          </td>


                          <td className="px-6 py-3.5 text-foreground/80 max-w-[200px] truncate">
                            {c.violation}
                          </td>


                          <td className="px-6 py-3.5">

                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                                SEVERITY_BADGE[
                                  c.severity
                                ]
                              }`}
                            >

                              {c.severity
                                .charAt(0)
                                .toUpperCase() +
                                c.severity.slice(1)}

                            </span>

                          </td>


                          <td className="px-6 py-3.5">

                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                                STATUS_BADGE[
                                  c.status
                                ]
                              }`}
                            >
                              {
                                STATUS_LABEL[
                                  c.status
                                ]
                              }
                            </span>

                          </td>


                          <td className="px-6 py-3.5 text-muted-foreground text-xs whitespace-nowrap">
                            {fmt(
                              c.incident_date
                            )}
                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </CardContent>

        </Card>

      </div>


      {/* ─────────────────────────────────
          ANALYTICS
      ───────────────────────────────── */}

      <AnalyticsSection
        students={students}
        cases={cases}
        monthly_chart={monthly_chart}
      />

    </div>
  )
}