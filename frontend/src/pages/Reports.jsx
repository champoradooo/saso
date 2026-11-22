import { useEffect, useState } from 'react'
import { api } from '../api/client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

import { Button } from '@/components/ui/button'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

import { Skeleton } from '@/components/ui/skeleton'

import {
  FileText,
  Download,
  Users,
  ShieldAlert,
  CalendarDays,
  TrendingUp,
  PackageSearch
} from 'lucide-react'


const CURRENT_YEAR =
  new Date().getFullYear()


const YEARS = [
  CURRENT_YEAR,
  CURRENT_YEAR - 1,
  CURRENT_YEAR - 2
]


const MONTHS = [
  'All',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]


const SEMESTERS = [
  {
    value: '1st',
    label: '1st Sem'
  },
  {
    value: '2nd',
    label: '2nd Sem'
  }
]


const LOST_FOUND_TYPES = [
  {
    value: 'All',
    label: 'All Records'
  },
  {
    value: 'Lost',
    label: 'Lost Items Only'
  },
  {
    value: 'Found',
    label: 'Found Items Only'
  }
]


function SummaryRow({
  label,
  value,
  sub
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-border/40 last:border-0">

      <div className="min-w-0 flex-1 pr-2">

        <p className="text-sm font-medium text-foreground leading-snug break-words">
          {label}
        </p>

        {sub && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {sub}
          </p>
        )}

      </div>

      <span className="text-lg font-bold text-primary shrink-0 tabular-nums">
        {value}
      </span>

    </div>
  )
}


function ReportCard({
  title,
  description,
  icon: Icon,
  iconCls,
  onGenerate,
  generating
}) {
  return (
    <Card className="shadow-none border-border/60">

      <CardContent className="p-5">

        <div className="flex items-start justify-between mb-4">

          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconCls}`}
          >
            <Icon className="w-5 h-5" />
          </div>

        </div>


        <h3 className="font-semibold text-foreground text-sm mb-1">
          {title}
        </h3>


        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          {description}
        </p>


        <Button
          size="sm"
          variant="outline"
          className="w-full gap-2 text-xs"
          onClick={onGenerate}
          disabled={generating}
        >

          <Download className="w-3.5 h-3.5" />

          {generating
            ? 'Generating…'
            : 'Generate Report'}

        </Button>

      </CardContent>

    </Card>
  )
}


export default function Reports() {

  const [stats, setStats] =
    useState(null)

  const [loading, setLoading] =
    useState(true)


  // =====================================================
  // GENERAL REPORT FILTERS
  // =====================================================

  const [year, setYear] =
    useState(
      String(CURRENT_YEAR)
    )

  const [month, setMonth] =
    useState('All')

  const [reportPeriod, setReportPeriod] =
    useState('Monthly')

  const [semester, setSemester] =
    useState('1st')


  // =====================================================
  // LOST & FOUND FILTER
  // =====================================================

  const [lostFoundType, setLostFoundType] =
    useState('All')


  // =====================================================
  // GENERATING
  // =====================================================

  const [generating, setGenerating] =
    useState(null)


  // =====================================================
  // LOAD DASHBOARD STATS
  // =====================================================

  useEffect(() => {

    api
      .get('/dashboard/stats/')
      .then(setStats)
      .catch(error => {
        console.error(
          'Failed to load report stats:',
          error
        )
      })
      .finally(() =>
        setLoading(false)
      )

  }, [])


  // =====================================================
  // REPORT URLS
  // =====================================================

  const REPORT_URLS = {

    students:
      '/api/reports/students/',

    discipline:
      '/api/reports/discipline/',

    activities:
      '/api/reports/activities/',

    performance:
      '/api/reports/performance/',

    lostFound:
      '/api/reports/lost-found/'

  }


  // =====================================================
  // GENERATE NORMAL REPORT
  // =====================================================

  const handleGenerate = async (
    type
  ) => {

    setGenerating(type)

    try {

      const params =
        new URLSearchParams({
          year,
          month,
          period: reportPeriod,
          semester
        })


      const res = await fetch(
        `${REPORT_URLS[type]}?${params.toString()}`
      )


      if (!res.ok) {
        throw new Error(
          'Failed to generate report'
        )
      }


      const blob =
        await res.blob()


      const url =
        URL.createObjectURL(blob)


      const a =
        document.createElement('a')


      a.href = url


      a.download =
        getFilename(
          res,
          `${type}-report.pdf`
        )


      document.body.appendChild(a)

      a.click()

      a.remove()


      URL.revokeObjectURL(url)

    } catch (error) {

      console.error(
        'Failed to generate report:',
        error
      )

      alert(
        'Failed to generate report. Make sure the backend is running.'
      )

    } finally {

      setGenerating(null)

    }
  }


  // =====================================================
  // GENERATE LOST & FOUND REPORT
  // =====================================================

  const handleGenerateLostFound =
    async () => {

      setGenerating(
        'lostFound'
      )

      try {

        const params =
          new URLSearchParams({
            year,
            month,
            period: reportPeriod,
            semester,
            item_type: lostFoundType
          })


        const res =
          await fetch(
            `${REPORT_URLS.lostFound}?${params.toString()}`
          )


        if (!res.ok) {

          throw new Error(
            'Failed to generate Lost & Found report'
          )

        }


        const blob =
          await res.blob()


        const url =
          URL.createObjectURL(blob)


        const a =
          document.createElement('a')


        a.href = url


        const typeName =
          lostFoundType === 'Lost'
            ? 'lost'
            : lostFoundType === 'Found'
              ? 'found'
              : 'all'


        a.download =
          getFilename(
            res,
            `lost-found-${typeName}-report.pdf`
          )


        document.body.appendChild(a)

        a.click()

        a.remove()


        URL.revokeObjectURL(url)

      } catch (error) {

        console.error(
          'Failed to generate Lost & Found report:',
          error
        )

        alert(
          'Failed to generate Lost & Found report. Make sure the backend is running.'
        )

      } finally {

        setGenerating(null)

      }
    }


  // =====================================================
  // PAGE
  // =====================================================

  return (

    <div className="p-6 space-y-6 max-w-screen-2xl">


      {/* =================================================
          HEADER
      ================================================= */}

      <div>

        <h1 className="text-2xl font-bold text-foreground">
          Reports
        </h1>

        <p className="text-sm text-muted-foreground mt-0.5">
          Generate and download official SASO reports
        </p>

      </div>


      {/* =================================================
          FILTERS
      ================================================= */}

      <Card className="shadow-none border-border/60">

        <CardContent className="p-5">

          <div className="flex flex-wrap gap-4 items-end">


            {/* ACADEMIC YEAR */}

            <div>

              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Academic Year
              </label>

              <Select
                value={year}
                onValueChange={setYear}
              >

                <SelectTrigger className="w-36 h-9">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>

                  {YEARS.map(
                    currentYear => (

                      <SelectItem
                        key={currentYear}
                        value={String(
                          currentYear
                        )}
                      >

                        {currentYear}–
                        {currentYear + 1}

                      </SelectItem>

                    )
                  )}

                </SelectContent>

              </Select>

            </div>


            {/* MONTH */}

            <div>

              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Month
              </label>

              <Select
                value={month}
                onValueChange={setMonth}
              >

                <SelectTrigger className="w-36 h-9">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>

                  {MONTHS.map(
                    currentMonth => (

                      <SelectItem
                        key={currentMonth}
                        value={currentMonth}
                      >
                        {currentMonth}
                      </SelectItem>

                    )
                  )}

                </SelectContent>

              </Select>

            </div>


            {/* REPORT PERIOD */}

            <div>

              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Report Period
              </label>

              <Select
                value={reportPeriod}
                onValueChange={setReportPeriod}
              >

                <SelectTrigger className="w-36 h-9">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>

                  <SelectItem value="Monthly">
                    Monthly
                  </SelectItem>

                  <SelectItem value="Yearly">
                    Yearly
                  </SelectItem>

                  <SelectItem value="Semestral">
                    Semestral
                  </SelectItem>

                </SelectContent>

              </Select>

            </div>


            {/* SEMESTER */}

            <div>

              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Semestral Report
              </label>

              <Select
                value={semester}
                onValueChange={setSemester}
              >

                <SelectTrigger className="w-36 h-9">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>

                  {SEMESTERS.map(
                    sem => (

                      <SelectItem
                        key={sem.value}
                        value={sem.value}
                      >
                        {sem.label}
                      </SelectItem>

                    )
                  )}

                </SelectContent>

              </Select>

            </div>


            {/* DESCRIPTION */}

            <p className="text-xs text-muted-foreground pb-1">

              Showing data for{' '}

              <span className="font-medium text-foreground">

                {month === 'All'
                  ? 'all months'
                  : month}

              </span>

              , {year}

              {' • '}

              <span className="font-medium text-foreground">
                {reportPeriod}
              </span>


              {reportPeriod === 'Semestral' && (

                <>

                  {' • '}

                  <span className="font-medium text-foreground">

                    {semester === '1st'
                      ? '1st Sem'
                      : '2nd Sem'}

                  </span>

                </>

              )}

            </p>

          </div>

        </CardContent>

      </Card>


      {/* =================================================
          REPORTS
      ================================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


        {/* =================================================
            AVAILABLE REPORTS
        ================================================= */}

        <div className="lg:col-span-2">

          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Available Reports
          </p>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">


            {/* STUDENTS */}

            <ReportCard
              title="Student Records Summary"
              description="Full list of enrolled students with clearance status, course, year level, and contact details."
              icon={Users}
              iconCls="bg-emerald-100 text-emerald-600"
              onGenerate={() =>
                handleGenerate(
                  'students'
                )
              }
              generating={
                generating === 'students'
              }
            />


            {/* DISCIPLINE */}

            <ReportCard
              title="Disciplinary Cases Report"
              description="Summary of all disciplinary incidents categorized by severity with sanctions."
              icon={ShieldAlert}
              iconCls="bg-red-100 text-red-600"
              onGenerate={() =>
                handleGenerate(
                  'discipline'
                )
              }
              generating={
                generating === 'discipline'
              }
            />


            {/* ACTIVITIES */}

            <ReportCard
              title="Activity Participation Log"
              description="List of SASO-organized activities, events, and student participation records for the selected period."
              icon={CalendarDays}
              iconCls="bg-green-100 text-green-600"
              onGenerate={() =>
                handleGenerate(
                  'activities'
                )
              }
              generating={
                generating === 'activities'
              }
            />


            {/* PERFORMANCE */}

            <ReportCard
              title="Office Performance Report"
              description="Analytics summary showing case resolution rates, student engagement, and overall office performance metrics."
              icon={TrendingUp}
              iconCls="bg-purple-100 text-purple-600"
              onGenerate={() =>
                handleGenerate(
                  'performance'
                )
              }
              generating={
                generating === 'performance'
              }
            />


            {/* =================================================
                LOST & FOUND
            ================================================= */}

            <Card className="shadow-none border-border/60">

              <CardContent className="p-5">

                <div className="flex items-start justify-between mb-4">

                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-100 text-orange-600">

                    <PackageSearch className="w-5 h-5" />

                  </div>

                </div>


                <h3 className="font-semibold text-foreground text-sm mb-1">
                  Lost & Found Report
                </h3>


                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  Generate a report of lost items, found items, or all Lost & Found records with totals and monthly summaries.
                </p>


                {/* TYPE FILTER */}

                <div className="mb-3">

                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Record Type
                  </label>

                  <Select
                    value={
                      lostFoundType
                    }
                    onValueChange={
                      setLostFoundType
                    }
                  >

                    <SelectTrigger className="w-full h-9">

                      <SelectValue />

                    </SelectTrigger>


                    <SelectContent>

                      {LOST_FOUND_TYPES.map(
                        type => (

                          <SelectItem
                            key={
                              type.value
                            }
                            value={
                              type.value
                            }
                          >

                            {type.label}

                          </SelectItem>

                        )
                      )}

                    </SelectContent>

                  </Select>

                </div>


                {/* GENERATE */}

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2 text-xs"
                  onClick={
                    handleGenerateLostFound
                  }
                  disabled={
                    generating ===
                    'lostFound'
                  }
                >

                  <Download className="w-3.5 h-3.5" />

                  {generating ===
                  'lostFound'
                    ? 'Generating…'
                    : 'Generate Report'}

                </Button>

              </CardContent>

            </Card>

          </div>

        </div>


        {/* =================================================
            QUICK SUMMARY
        ================================================= */}

        <div>

          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Current Summary
          </p>


          <Card className="shadow-none border-border/60">

            <CardHeader className="pb-2">

              <CardTitle className="text-sm font-semibold flex items-center gap-2">

                <FileText className="w-4 h-4 text-primary" />

                At a Glance

              </CardTitle>

            </CardHeader>


            <CardContent className="pt-0">

              {loading ? (

                [...Array(6)].map(
                  (_, index) => (

                    <Skeleton
                      key={index}
                      className="h-10 w-full mb-1"
                    />

                  )
                )

              ) : stats ? (

                <div>

                  {/* STUDENTS */}

                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Students
                  </p>


                  <SummaryRow
                    label="Total Enrolled"
                    value={
                      stats.students.total
                    }
                  />


                  {/* =================================================
                      CLEARANCE COMPLETED AND CLEARANCE PENDING
                      HAVE BEEN REMOVED FROM THIS SECTION
                  ================================================= */}


                  {/* DISCIPLINARY */}

                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-4 mb-2">
                    Disciplinary Cases
                  </p>


                  <SummaryRow
                    label="Total Cases"
                    value={
                      stats.cases.total
                    }
                  />


                  <SummaryRow
                    label="Resolved"
                    value={
                      stats.cases.resolved
                    }
                  />


                  <SummaryRow
                    label="Pending / Under Review"
                    value={
                      stats.cases.pending +
                      stats.cases.under_review
                    }
                  />


                  {/* SEVERITY */}

                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-4 mb-2">
                    By Severity
                  </p>


                  <SummaryRow
                    label="Minor"
                    value={
                      stats.cases.minor
                    }
                  />


                  <SummaryRow
                    label="Moderate"
                    value={
                      stats.cases.moderate
                    }
                  />


                  <SummaryRow
                    label="Major"
                    value={
                      stats.cases.major
                    }
                  />

                </div>

              ) : (

                <p className="text-sm text-muted-foreground">
                  Failed to load data.
                </p>

              )}

            </CardContent>

          </Card>

        </div>

      </div>

    </div>
  )
}


/* =========================================================
   GET PDF FILENAME
========================================================= */

function getFilename(
  response,
  fallback
) {

  const disposition =
    response.headers.get(
      'Content-Disposition'
    )

  if (!disposition) {
    return fallback
  }

  const match =
    disposition.match(
      /filename="?([^"]+)"?/i
    )

  return match?.[1] || fallback
}