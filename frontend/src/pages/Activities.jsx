import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef
} from 'react'

import { api } from '../api/client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'

import { Skeleton } from '@/components/ui/skeleton'

import {
  Plus,
  CalendarDays,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock3,
  Pencil,
  Archive,
  History,
  RotateCcw,
  Eye,
  FileText,
  ExternalLink,
  X
} from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'


/* =========================================================
   CONSTANTS
========================================================= */

const MONTHS = [
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

const DAYS = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat'
]

const COURSES = [
  'BS IT',
  'BS BA',
  'BS Ed',
  'BS Nursing',
  'BS Accountancy',
  'BS Crim',
  'BS THM',
  'BS Psych',
]

const COURSE_LABELS = {
  BSIT: 'BS IT',
  'BS IT': 'BS IT',
  BSBA: 'BS BA',
  'BS BA': 'BS BA',
  BSED: 'BS Ed',
  'BS Ed': 'BS Ed',
  BSN: 'BS Nursing',
  BSNursing: 'BS Nursing',
  'BS Nursing': 'BS Nursing',
  BSA: 'BS Accountancy',
  BSAccountancy: 'BS Accountancy',
  'BS Accountancy': 'BS Accountancy',
  BSCRIM: 'BS Crim',
  BSCrim: 'BS Crim',
  'BS Crim': 'BS Crim',
  BSTHM: 'BS THM',
  'BS THM': 'BS THM',
  BSPSYCH: 'BS Psych',
  BSPsych: 'BS Psych',
  'BS Psych': 'BS Psych',
}

function formatCourse(course) {
  if (!course) return '—'
  return COURSE_LABELS[course] || course
}

const YEAR_LEVELS = [
  '1',
  '2',
  '3',
  '4'
]


/* =========================================================
   HELPERS
========================================================= */

function fmt(value) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString(
    'en-PH',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }
  )
}


function formatTime(time) {
  if (!time) return ''

  const parts = time.split(':')
  let hour = parseInt(parts[0], 10)
  const minutes = parts[1] || '00'

  const period = hour >= 12 ? 'PM' : 'AM'

  if (hour === 0) {
    hour = 12
  } else if (hour > 12) {
    hour -= 12
  }

  return hour + ':' + minutes + ' ' + period
}


function getTimeRange(activity) {
  if (
    !activity.start_time &&
    !activity.end_time
  ) {
    return null
  }

  if (
    activity.start_time &&
    activity.end_time
  ) {
    return (
      formatTime(activity.start_time) +
      ' - ' +
      formatTime(activity.end_time)
    )
  }

  if (activity.start_time) {
    return formatTime(activity.start_time)
  }

  if (activity.end_time) {
    return formatTime(activity.end_time)
  }

  return null
}


function normalizeDate(value) {
  if (!value) return ''

  return String(value).slice(0, 10)
}


function normalizeTime(value) {
  if (!value) return ''

  return String(value).slice(0, 5)
}


/* =========================================================
   DEPARTMENTS HELPERS
========================================================= */

function parseDepartmentsList(value) {
  if (!value) return []

  if (Array.isArray(value)) {
    return value
      .map(item => formatCourse(String(item).trim()))
      .filter(Boolean)
      .filter(item => item !== '—')
  }

  if (typeof value === 'string') {
    const text = value.trim()

    if (!text) {
      return []
    }

    try {
      const parsed = JSON.parse(text)

      if (Array.isArray(parsed)) {
        return parseDepartmentsList(parsed)
      }
    } catch {
      // Treat as comma-separated text.
    }

    return text
      .split(',')
      .map(item => formatCourse(item.trim()))
      .filter(Boolean)
      .filter(item => item !== '—')
  }

  return []
}


function normalizeDepartments(value) {
  const list = parseDepartmentsList(value)

  if (list.length === 0) {
    return ''
  }

  return list.join(', ')
}


function DepartmentsMultiSelect({
  value = [],
  onChange
}) {
  const [open, setOpen] =
    useState(false)

  const rootRef = useRef(null)

  const selected = Array.isArray(value)
    ? value
    : []

  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = event => {
      if (
        rootRef.current &&
        !rootRef.current.contains(
          event.target
        )
      ) {
        setOpen(false)
      }
    }

    document.addEventListener(
      'pointerdown',
      handlePointerDown
    )

    return () => {
      document.removeEventListener(
        'pointerdown',
        handlePointerDown
      )
    }
  }, [open])

  const toggleCourse = course => {
    if (selected.includes(course)) {
      onChange(
        selected.filter(
          item => item !== course
        )
      )
      return
    }

    onChange([...selected, course])
  }

  return (
    <div
      ref={rootRef}
      className="col-span-2 relative"
    >

      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
        Departments Involved
      </label>

      <button
        type="button"
        onClick={() =>
          setOpen(current => !current)
        }
        className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >

        <span
          className={
            selected.length
              ? 'text-foreground'
              : 'text-muted-foreground'
          }
        >

          {selected.length
            ? selected.join(', ')
            : 'Select courses...'}

        </span>

        <ChevronRight
          className={
            'h-4 w-4 shrink-0 text-muted-foreground transition ' +
            (
              open
                ? 'rotate-90'
                : ''
            )
          }
        />

      </button>

      {open && (

        <div className="absolute z-[9999] mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-background p-1 shadow-lg">

          {COURSES.map(course => {

            const checked =
              selected.includes(course)

            return (

              <label
                key={course}
                className={
                  'flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted ' +
                  (
                    checked
                      ? 'bg-primary/5'
                      : ''
                  )
                }
              >

                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    toggleCourse(course)
                  }
                  className="h-4 w-4 accent-primary"
                />

                <span>{course}</span>

              </label>

            )

          })}

        </div>

      )}

    </div>
  )
}


function departmentsToJSON(value) {
  if (!value) {
    return JSON.stringify([])
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value)
  }

  if (typeof value === 'string') {
    const text = value.trim()

    if (!text) {
      return JSON.stringify([])
    }

    try {
      const parsed = JSON.parse(text)

      if (Array.isArray(parsed)) {
        return JSON.stringify(parsed)
      }
    } catch {
      // Treat as comma-separated text.
    }

    const departments = text
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)

    return JSON.stringify(departments)
  }

  return JSON.stringify([])
}


/* =========================================================
   FILE HELPERS
========================================================= */

/*
  Django usually returns files like:

  /media/activities/concept_papers/file.pdf

  Since the React frontend is running on:

  http://localhost:5173

  while Django is running on:

  http://127.0.0.1:8000

  we need to make sure /media/ URLs point to Django.
*/

function getFileUrl(value) {
  if (!value) {
    return ''
  }

  let fileValue = value

  /*
    Some serializers may return an object such as:

    {
      url: "/media/file.pdf"
    }

    or:

    {
      file: "/media/file.pdf"
    }
  */

  if (
    typeof fileValue === 'object'
  ) {
    fileValue =
      fileValue.url ||
      fileValue.file ||
      fileValue.path ||
      ''

    if (!fileValue) {
      return ''
    }
  }

  const url =
    String(fileValue).trim()

  if (!url) {
    return ''
  }

  /*
    Already an absolute URL.
  */
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:')
  ) {
    return url
  }

  /*
    Django media files.
  */
  if (
    url.startsWith('/media/')
  ) {
    return (
      'http://127.0.0.1:8000' +
      url
    )
  }

  /*
    Other absolute paths.
  */
  if (url.startsWith('/')) {
    return (
      'http://127.0.0.1:8000' +
      url
    )
  }

  /*
    Relative file path.
  */
  return (
    'http://127.0.0.1:8000/' +
    url
  )
}


function getFileName(value) {
  if (!value) {
    return ''
  }

  let fileValue = value

  if (
    typeof fileValue === 'object'
  ) {
    fileValue =
      fileValue.name ||
      fileValue.url ||
      fileValue.file ||
      fileValue.path ||
      ''
  }

  if (!fileValue) {
    return ''
  }

  const text =
    String(fileValue)

  const withoutQuery =
    text.split('?')[0]

  const parts =
    withoutQuery.split('/')

  return (
    parts[parts.length - 1] ||
    'Uploaded file'
  )
}


function getConceptPaperUrl(activity) {
  return getFileUrl(
    activity?.concept_paper_url ||
    activity?.concept_paper
  )
}


function getPermitFileUrl(activity) {
  return getFileUrl(
    activity?.permit_file_url ||
    activity?.permit_file
  )
}


/* =========================================================
   DOCUMENT LINKS
========================================================= */

function ActivityDocuments({
  activity,
  compact = false
}) {
  if (!activity) {
    return null
  }

  const conceptPaperUrl =
    getConceptPaperUrl(activity)

  const permitFileUrl =
    getPermitFileUrl(activity)

  if (
    !conceptPaperUrl &&
    !permitFileUrl
  ) {
    return null
  }

  return (
    <div
      className={
        compact
          ? 'flex flex-wrap gap-1.5'
          : 'rounded-xl border p-4 space-y-3'
      }
    >

      {!compact && (
        <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
          Documents
        </p>
      )}

      <div
        className={
          compact
            ? 'flex flex-wrap gap-1.5'
            : 'flex flex-wrap gap-2'
        }
      >

        {conceptPaperUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={e => {
              e.stopPropagation()

              window.open(
                conceptPaperUrl,
                '_blank',
                'noopener,noreferrer'
              )
            }}
          >
            <FileText className="w-3.5 h-3.5" />

            {compact
              ? 'Concept Paper'
              : 'View Approved Concept Paper'}

            <ExternalLink className="w-3 h-3" />
          </Button>
        )}

        {permitFileUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={e => {
              e.stopPropagation()

              window.open(
                permitFileUrl,
                '_blank',
                'noopener,noreferrer'
              )
            }}
          >
            <FileText className="w-3.5 h-3.5" />

            {compact
              ? 'Permit File'
              : 'View Permit File'}

            <ExternalLink className="w-3 h-3" />
          </Button>
        )}

      </div>

      {!compact && (
        <div className="space-y-1">

          {conceptPaperUrl && (
            <p className="text-[11px] text-muted-foreground truncate">
              Concept Paper:{' '}
              {getFileName(
                activity.concept_paper
              )}
            </p>
          )}

          {permitFileUrl && (
            <p className="text-[11px] text-muted-foreground truncate">
              Permit:{' '}
              {getFileName(
                activity.permit_file
              )}
            </p>
          )}

        </div>
      )}

    </div>
  )
}


/* =========================================================
   FETCH ALL ACTIVITIES
========================================================= */

async function fetchAllActivities() {
  const all = []

  let url =
    '/activities/activities/'

  const visited = new Set()

  while (
    url &&
    !visited.has(url)
  ) {
    visited.add(url)

    const data =
      await api.get(url)

    const pageResults =
      Array.isArray(data)
        ? data
        : (
            Array.isArray(
              data?.results
            )
              ? data.results
              : []
          )

    all.push(
      ...pageResults
    )

    if (Array.isArray(data)) {
      break
    }

    const next =
      data?.next

    if (!next) {
      break
    }

    try {
      const nextUrl =
        new URL(
          next,
          window.location.origin
        )

      url =
        nextUrl.pathname +
        nextUrl.search
    } catch {
      url = next
    }
  }

  const unique =
    new Map()

  all.forEach(
    activity => {
      if (
        activity &&
        activity.id != null
      ) {
        unique.set(
          activity.id,
          activity
        )
      }
    }
  )

  return Array.from(
    unique.values()
  )
}


/* =========================================================
   ACTIVITY FIELD
========================================================= */

function ActivityField({
  label,
  id,
  type = 'text',
  required = false,
  half = false,
  form,
  set,
  placeholder = ''
}) {
  return (
    <div
      className={
        half
          ? ''
          : 'col-span-2'
      }
    >

      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">

        {label}

        {required && (
          <span className="text-destructive ml-0.5">
            *
          </span>
        )}

      </label>

      <Input
        type={type}
        value={
          form[id] ?? ''
        }
        onChange={e =>
          set(
            id,
            e.target.value
          )
        }
        placeholder={
          placeholder
        }
      />

    </div>
  )
}


/* =========================================================
   ACTIVITY CARD
========================================================= */

function ActivityCard({
  a,
  onClick,
  onArchive,
  onCancel,
  onAttendance
}) {
  const timeRange =
    getTimeRange(a)

  const date =
    new Date(
      a.event_date
    )

  const validDate =
    !Number.isNaN(
      date.getTime()
    )

  const isCancelled =
    a.status ===
    'cancelled'

  const hasDocuments =
    Boolean(
      getConceptPaperUrl(a) ||
      getPermitFileUrl(a)
    )

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {

        if (
          e.key === 'Enter' ||
          e.key === ' '
        ) {
          e.preventDefault()

          onClick?.()
        }

      }}
      className="flex gap-5 p-5 rounded-2xl border border-border/60 bg-card hover:bg-muted/30 hover:shadow-sm transition-all cursor-pointer"
    >

      <div className="shrink-0 w-14 h-fit rounded-xl text-center py-2.5 bg-primary/10 text-primary">

        <p className="text-xs font-bold uppercase">

          {validDate
            ? date.toLocaleDateString(
                'en-PH',
                {
                  month: 'short'
                }
              )
            : '---'}

        </p>

        <p className="text-2xl font-bold leading-tight">

          {validDate
            ? date.getDate()
            : '--'}

        </p>

      </div>


      <div className="flex-1 min-w-0">

        <div className="flex items-center gap-2 flex-wrap">

          <p
            className={
              'font-semibold text-base ' +
              (
                isCancelled
                  ? 'text-muted-foreground line-through decoration-muted-foreground/50'
                  : ''
              )
            }
          >
            {a.title}
          </p>

          {isCancelled && (
            <span className="rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 text-[10px] font-semibold">
              Cancelled
            </span>
          )}

        </div>


        <p className="text-xs text-muted-foreground mt-0.5">

          {fmt(
            a.event_date
          )}

          {a.end_date &&
            normalizeDate(
              a.end_date
            ) !==
              normalizeDate(
                a.event_date
              ) && (
              <>
                {' '}
                -{' '}
                {fmt(
                  a.end_date
                )}
              </>
            )}

        </p>


        {timeRange && (
          <div className="flex items-center gap-1 mt-1.5">

            <Clock3 className="w-3.5 h-3.5 text-primary" />

            <span className="text-xs font-medium">
              {timeRange}
            </span>

          </div>
        )}


        {a.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {a.description}
          </p>
        )}


        <div className="flex items-center gap-3 mt-1.5 flex-wrap">

          {a.location && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">

              <MapPin className="w-3 h-3" />

              {a.location}

            </span>
          )}

          {a.organizer && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">

              <User className="w-3 h-3" />

              {a.organizer}

            </span>
          )}

        </div>


        {/* DOCUMENT BUTTONS */}

        {hasDocuments && (
          <div
            className="flex flex-wrap gap-1.5 mt-3"
            onClick={e =>
              e.stopPropagation()
            }
          >

            <ActivityDocuments
              activity={a}
              compact
            />

          </div>
        )}


        {/* ACTIONS */}

        <div
          className="flex items-center gap-2 mt-3 flex-wrap"
          onClick={e =>
            e.stopPropagation()
          }
        >

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={e => {

              e.stopPropagation()

              onClick?.()

            }}
          >

            <Pencil className="w-3.5 h-3.5 mr-1.5" />

            Edit

          </Button>


          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={e => {

              e.stopPropagation()

              onAttendance?.(a)

            }}
          >

            <Users className="w-3.5 h-3.5 mr-1.5" />

            Attendance

          </Button>


          <Button
            type="button"
            variant="outline"
            size="sm"
            className={
              'h-8 text-xs ' +
              (
                isCancelled
                  ? 'text-muted-foreground border-border'
                  : 'text-amber-600 border-amber-300 hover:bg-amber-50 hover:text-amber-700'
              )
            }
            onClick={e => {

              e.stopPropagation()

              onCancel?.(a)

            }}
            disabled={
              isCancelled
            }
          >

            <XCircle className="w-3.5 h-3.5 mr-1.5" />

            {isCancelled
              ? 'Cancelled'
              : 'Cancel'}

          </Button>


          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            onClick={e => {

              e.stopPropagation()

              onArchive?.(a)

            }}
          >

            <Archive className="w-3.5 h-3.5 mr-1.5" />

            Archive

          </Button>

        </div>

      </div>

    </div>
  )
}


/* =========================================================
   STATUS ACTIVITY ROW
========================================================= */

function StatusActivityRow({
  activity,
  onEdit,
  onAttendance
}) {
  const date =
    new Date(
      activity.event_date
    )

  const validDate =
    !Number.isNaN(
      date.getTime()
    )

  const hasDocuments =
    Boolean(
      getConceptPaperUrl(
        activity
      ) ||
      getPermitFileUrl(
        activity
      )
    )

  return (
    <div className="rounded-lg border border-border/60 bg-card p-3 hover:bg-muted/30 transition-colors">

      <div className="flex items-center justify-between gap-3">

        <div className="flex items-center gap-3 min-w-0">

          <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary flex flex-col items-center justify-center">

            <span className="text-[9px] font-bold uppercase leading-none">

              {validDate
                ? date.toLocaleDateString(
                    'en-PH',
                    {
                      month: 'short'
                    }
                  )
                : '---'}

            </span>

            <span className="text-sm font-bold leading-tight">

              {validDate
                ? date.getDate()
                : '--'}

            </span>

          </div>


          <div className="min-w-0">

            <div className="flex items-center gap-2 flex-wrap">

              <p className="text-sm font-semibold truncate">
                {activity.title}
              </p>

              {activity.status ===
                'cancelled' && (
                <span className="shrink-0 rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 text-[9px] font-semibold">
                  Cancelled
                </span>
              )}

            </div>


            <div className="flex items-center gap-3 mt-1 flex-wrap">

              <span className="text-xs text-muted-foreground">
                {fmt(
                  activity.event_date
                )}
              </span>

              {getTimeRange(
                activity
              ) && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">

                  <Clock3 className="w-3 h-3" />

                  {getTimeRange(
                    activity
                  )}

                </span>
              )}

              {activity.location && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">

                  <MapPin className="w-3 h-3" />

                  <span className="max-w-[180px] truncate">
                    {activity.location}
                  </span>

                </span>
              )}

            </div>


            {hasDocuments && (
              <div
                className="flex flex-wrap gap-1.5 mt-2"
                onClick={e =>
                  e.stopPropagation()
                }
              >

                <ActivityDocuments
                  activity={activity}
                  compact
                />

              </div>
            )}

          </div>

        </div>


        <div className="flex shrink-0 gap-1.5">

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2.5"
            onClick={() =>
              onEdit(
                activity
              )
            }
          >

            <Pencil className="w-3.5 h-3.5" />

          </Button>


          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2.5"
            onClick={() =>
              onAttendance(
                activity
              )
            }
          >

            <Users className="w-3.5 h-3.5" />

          </Button>

        </div>

      </div>

    </div>
  )
}


/* =========================================================
   STATUS ACTIVITIES PANEL
========================================================= */

function StatusActivitiesPanel({
  status,
  activities,
  onClose,
  onEdit,
  onAttendance
}) {
  const title =
    status === 'total'
      ? 'All Activities'
      : status === 'upcoming'
        ? 'Upcoming Activities'
        : 'Cancelled Activities'

  return (
    <Card className="shadow-none border-border/60">

      <CardHeader className="pb-3">

        <div className="flex items-center justify-between gap-3">

          <div>

            <CardTitle className="text-sm">
              {title}
            </CardTitle>

            <p className="text-xs text-muted-foreground mt-0.5">

              {activities.length}{' '}

              {activities.length === 1
                ? 'activity'
                : 'activities'}

            </p>

          </div>


          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={onClose}
          >

            <X className="w-4 h-4" />

          </Button>

        </div>

      </CardHeader>


      <CardContent>

        {activities.length === 0 ? (

          <div className="rounded-lg border border-dashed p-8 text-center">

            <CalendarDays className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />

            <p className="text-sm font-medium">
              No activities found
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              There are no activities in this category.
            </p>

          </div>

        ) : (

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">

            {activities.map(
              activity => (

                <StatusActivityRow
                  key={activity.id}
                  activity={activity}
                  onEdit={onEdit}
                  onAttendance={onAttendance}
                />

              )
            )}

          </div>

        )}

      </CardContent>

    </Card>
  )
}


/* =========================================================
   ADD ACTIVITY MODAL
========================================================= */

function AddActivityModal({
  onClose,
  onSaved
}) {
  const [form, setForm] =
    useState({
      title: '',
      description: '',
      event_date: '',
      end_date: '',
      start_time: '',
      end_time: '',
      location: '',
      organizer: '',
      event_type: '',
      departments: [],
      guest_speaker: '',
      participants: '',
      concept_paper: null,
      permit_file: null
    })

  const [errors, setErrors] =
    useState({})

  const [saving, setSaving] =
    useState(false)

  const set = (
    key,
    value
  ) => {

    setForm(prev => ({
      ...prev,
      [key]: value
    }))

  }


  const handleSubmit =
    async e => {

      e.preventDefault()

      setErrors({})


      if (
        !form.title.trim() ||
        !form.event_date
      ) {

        setErrors({
          __root:
            'Title and event date are required.'
        })

        return
      }


      if (
        form.end_date &&
        form.end_date <
          form.event_date
      ) {

        setErrors({
          __root:
            'End date cannot be earlier than event date.'
        })

        return
      }


      if (
        form.start_time &&
        form.end_time &&
        form.event_date ===
          (
            form.end_date ||
            form.event_date
          ) &&
        form.end_time <
          form.start_time
      ) {

        setErrors({
          __root:
            'End time cannot be earlier than start time.'
        })

        return
      }


      setSaving(true)


      try {

        const data =
          new FormData()


        data.append(
          'title',
          form.title
        )

        data.append(
          'description',
          form.description
        )

        data.append(
          'event_date',
          form.event_date
        )


        if (form.end_date) {

          data.append(
            'end_date',
            form.end_date
          )

        }


        if (form.start_time) {

          data.append(
            'start_time',
            form.start_time
          )

        }


        if (form.end_time) {

          data.append(
            'end_time',
            form.end_time
          )

        }


        data.append(
          'location',
          form.location
        )

        data.append(
          'organizer',
          form.organizer
        )

        data.append(
          'event_type',
          form.event_type
        )


        data.append(
          'departments',
          departmentsToJSON(
            form.departments
          )
        )


        data.append(
          'guest_speaker',
          form.guest_speaker
        )


        if (
          form.participants !== ''
        ) {

          data.append(
            'participants',
            form.participants
          )

        }


        if (
          form.concept_paper
        ) {

          data.append(
            'concept_paper',
            form.concept_paper
          )

        }


        if (
          form.permit_file
        ) {

          data.append(
            'permit_file',
            form.permit_file
          )

        }


        await api.post(
          '/activities/activities/',
          data
        )


        await onSaved()

        onClose()

      } catch (err) {

        console.error(
          'Failed to save activity:',
          err
        )

        setErrors({
          __root:
            err?.message ||
            'Failed to save activity.'
        })

      } finally {

        setSaving(false)

      }

    }


  return (
    <Dialog
      open
      onOpenChange={onClose}
    >

      <DialogContent className="max-h-[92vh] w-[95vw] max-w-[calc(100%-2rem)] gap-5 overflow-y-auto p-6 sm:max-w-3xl">

        <DialogHeader>

          <DialogTitle className="text-xl">
            Add Activity
          </DialogTitle>

        </DialogHeader>


        <form
          onSubmit={handleSubmit}
          className="space-y-4 py-2"
        >

          {errors.__root && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3">
              {errors.__root}
            </div>
          )}


          <div className="grid grid-cols-2 gap-4">

            <ActivityField
              label="Title"
              id="title"
              required
              form={form}
              set={set}
              placeholder="e.g. Leadership Training Seminar"
            />

            <ActivityField
              label="Event Date"
              id="event_date"
              type="date"
              required
              half
              form={form}
              set={set}
            />

            <ActivityField
              label="End Date"
              id="end_date"
              type="date"
              half
              form={form}
              set={set}
            />

            <ActivityField
              label="Start Time"
              id="start_time"
              type="time"
              half
              form={form}
              set={set}
            />

            <ActivityField
              label="End Time"
              id="end_time"
              type="time"
              half
              form={form}
              set={set}
            />

            <ActivityField
              label="Location"
              id="location"
              half
              form={form}
              set={set}
            />

            <ActivityField
              label="Organizer"
              id="organizer"
              half
              form={form}
              set={set}
            />

            <ActivityField
              label="Type of Event"
              id="event_type"
              form={form}
              set={set}
              placeholder="e.g. Seminar, Training, Workshop"
            />

            <ActivityField
              label="Participants"
              id="participants"
              type="number"
              form={form}
              set={set}
              placeholder="Number of participants"
            />

            <ActivityField
              label="Guest Speaker"
              id="guest_speaker"
              form={form}
              set={set}
              placeholder="Optional"
            />

            <DepartmentsMultiSelect
              value={form.departments}
              onChange={value =>
                set(
                  'departments',
                  value
                )
              }
            />


            <div className="col-span-2">

              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Description
              </label>

              <textarea
                value={
                  form.description
                }
                onChange={e =>
                  set(
                    'description',
                    e.target.value
                  )
                }
                rows={3}
                className="w-full rounded-md border border-input px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />

            </div>


            <div className="col-span-2">

              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Approved Concept Paper
              </label>

              <Input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={e =>
                  set(
                    'concept_paper',
                    e.target.files?.[0] ||
                      null
                  )
                }
              />

              <p className="text-[11px] text-muted-foreground mt-1">
                Upload the approved concept paper.
              </p>

            </div>


            <div className="col-span-2">

              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Permit File
              </label>

              <Input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={e =>
                  set(
                    'permit_file',
                    e.target.files?.[0] ||
                      null
                  )
                }
              />

              <p className="text-[11px] text-muted-foreground mt-1">
                Upload the approved permit file.
              </p>

            </div>

          </div>


          <DialogFooter>

            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={saving}
            >
              {saving
                ? 'Saving…'
                : 'Add Activity'}
            </Button>

          </DialogFooter>

        </form>

      </DialogContent>

    </Dialog>
  )
}


/* =========================================================
   EDIT ACTIVITY MODAL
========================================================= */

function EditActivityModal({
  activity,
  onClose,
  onSaved
}) {
  const [form, setForm] =
    useState({
      title:
        activity.title || '',

      description:
        activity.description || '',

      event_date:
        normalizeDate(
          activity.event_date
        ),

      end_date:
        normalizeDate(
          activity.end_date
        ),

      start_time:
        normalizeTime(
          activity.start_time
        ),

      end_time:
        normalizeTime(
          activity.end_time
        ),

      location:
        activity.location || '',

      organizer:
        activity.organizer || '',

      event_type:
        activity.event_type || '',

      departments:
        parseDepartmentsList(
          activity.departments
        ),

      guest_speaker:
        activity.guest_speaker || '',

      participants:
        activity.participants ?? '',

      concept_paper: null,

      permit_file: null
    })


  const [errors, setErrors] =
    useState({})

  const [saving, setSaving] =
    useState(false)


  const set = (
    key,
    value
  ) => {

    setForm(prev => ({
      ...prev,
      [key]: value
    }))

  }


  const conceptPaperUrl =
    getConceptPaperUrl(
      activity
    )

  const permitFileUrl =
    getPermitFileUrl(
      activity
    )


  const handleSubmit =
    async e => {

      e.preventDefault()

      setErrors({})


      if (
        !form.title.trim() ||
        !form.event_date
      ) {

        setErrors({
          __root:
            'Title and event date are required.'
        })

        return
      }


      if (
        form.end_date &&
        form.end_date <
          form.event_date
      ) {

        setErrors({
          __root:
            'End date cannot be earlier than event date.'
        })

        return
      }


      if (
        form.start_time &&
        form.end_time &&
        form.event_date ===
          (
            form.end_date ||
            form.event_date
          ) &&
        form.end_time <
          form.start_time
      ) {

        setErrors({
          __root:
            'End time cannot be earlier than start time.'
        })

        return
      }


      setSaving(true)


      try {

        const data =
          new FormData()


        data.append(
          'title',
          form.title
        )

        data.append(
          'description',
          form.description
        )

        data.append(
          'event_date',
          form.event_date
        )


        if (form.end_date) {

          data.append(
            'end_date',
            form.end_date
          )

        }


        if (form.start_time) {

          data.append(
            'start_time',
            form.start_time
          )

        }


        if (form.end_time) {

          data.append(
            'end_time',
            form.end_time
          )

        }


        data.append(
          'location',
          form.location
        )

        data.append(
          'organizer',
          form.organizer
        )

        data.append(
          'event_type',
          form.event_type
        )


        data.append(
          'departments',
          departmentsToJSON(
            form.departments
          )
        )


        data.append(
          'guest_speaker',
          form.guest_speaker
        )


        data.append(
          'participants',
          form.participants === ''
            ? ''
            : form.participants
        )


        /*
          Only send a new file when the
          user actually selected one.

          This preserves the existing
          uploaded file when editing
          other fields.
        */

        if (
          form.concept_paper
        ) {

          data.append(
            'concept_paper',
            form.concept_paper
          )

        }


        if (
          form.permit_file
        ) {

          data.append(
            'permit_file',
            form.permit_file
          )

        }


        await api.patch(
          '/activities/activities/' +
          activity.id +
          '/',
          data
        )


        /*
          IMPORTANT:

          Do not reset selectedStatus.

          This allows:

          Upcoming
             ↓
          Edit
             ↓
          Save
             ↓
          Upcoming

          Cancelled
             ↓
          Edit
             ↓
          Save
             ↓
          Cancelled
        */

        await onSaved()

        onClose()

      } catch (err) {

        console.error(
          'Failed to update activity:',
          err
        )

        setErrors({
          __root:
            err?.message ||
            'Failed to update activity.'
        })

      } finally {

        setSaving(false)

      }

    }


  return (
    <Dialog
      open
      onOpenChange={onClose}
    >

      <DialogContent className="max-h-[92vh] w-[95vw] max-w-[calc(100%-2rem)] gap-5 overflow-y-auto p-6 sm:max-w-3xl">

        <DialogHeader>

          <DialogTitle className="flex items-center gap-2 text-xl">

            <Pencil className="w-4 h-4" />

            Edit Activity

          </DialogTitle>

        </DialogHeader>


        <form
          onSubmit={handleSubmit}
          className="space-y-4 py-2"
        >

          {errors.__root && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3">
              {errors.__root}
            </div>
          )}


          <div className="grid grid-cols-2 gap-4">

            <ActivityField
              label="Title"
              id="title"
              required
              form={form}
              set={set}
            />

            <ActivityField
              label="Event Date"
              id="event_date"
              type="date"
              required
              half
              form={form}
              set={set}
            />

            <ActivityField
              label="End Date"
              id="end_date"
              type="date"
              half
              form={form}
              set={set}
            />

            <ActivityField
              label="Start Time"
              id="start_time"
              type="time"
              half
              form={form}
              set={set}
            />

            <ActivityField
              label="End Time"
              id="end_time"
              type="time"
              half
              form={form}
              set={set}
            />

            <ActivityField
              label="Location"
              id="location"
              half
              form={form}
              set={set}
            />

            <ActivityField
              label="Organizer"
              id="organizer"
              half
              form={form}
              set={set}
            />

            <ActivityField
              label="Type of Event"
              id="event_type"
              form={form}
              set={set}
            />

            <ActivityField
              label="Participants"
              id="participants"
              type="number"
              form={form}
              set={set}
            />

            <ActivityField
              label="Guest Speaker"
              id="guest_speaker"
              form={form}
              set={set}
              placeholder="Optional"
            />

            <DepartmentsMultiSelect
              value={form.departments}
              onChange={value =>
                set(
                  'departments',
                  value
                )
              }
            />


            <div className="col-span-2">

              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Description
              </label>

              <textarea
                value={
                  form.description
                }
                onChange={e =>
                  set(
                    'description',
                    e.target.value
                  )
                }
                rows={3}
                className="w-full rounded-md border border-input px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />

            </div>


            {/* =================================================
                CURRENT DOCUMENTS
            ================================================= */}

            {(conceptPaperUrl ||
              permitFileUrl) && (

              <div className="col-span-2">

                <ActivityDocuments
                  activity={
                    activity
                  }
                />

              </div>

            )}


            {/* =================================================
                REPLACE CONCEPT PAPER
            ================================================= */}

            <div className="col-span-2">

              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Replace Approved Concept Paper
              </label>

              <Input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={e =>
                  set(
                    'concept_paper',
                    e.target.files?.[0] ||
                      null
                  )
                }
              />

              {conceptPaperUrl ? (

                <div className="flex items-center justify-between gap-2 mt-2 rounded-lg border bg-muted/30 p-2.5">

                  <div className="flex items-center gap-2 min-w-0">

                    <FileText className="w-4 h-4 shrink-0 text-primary" />

                    <span className="text-xs truncate">
                      {getFileName(
                        activity.concept_paper
                      )}
                    </span>

                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs shrink-0"
                    onClick={() =>
                      window.open(
                        conceptPaperUrl,
                        '_blank',
                        'noopener,noreferrer'
                      )
                    }
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    View
                  </Button>

                </div>

              ) : (

                <p className="text-[11px] text-muted-foreground mt-1">
                  No concept paper has been uploaded yet.
                </p>

              )}

            </div>


            {/* =================================================
                REPLACE PERMIT
            ================================================= */}

            <div className="col-span-2">

              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Replace Permit File
              </label>

              <Input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={e =>
                  set(
                    'permit_file',
                    e.target.files?.[0] ||
                      null
                  )
                }
              />

              {permitFileUrl ? (

                <div className="flex items-center justify-between gap-2 mt-2 rounded-lg border bg-muted/30 p-2.5">

                  <div className="flex items-center gap-2 min-w-0">

                    <FileText className="w-4 h-4 shrink-0 text-primary" />

                    <span className="text-xs truncate">
                      {getFileName(
                        activity.permit_file
                      )}
                    </span>

                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs shrink-0"
                    onClick={() =>
                      window.open(
                        permitFileUrl,
                        '_blank',
                        'noopener,noreferrer'
                      )
                    }
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    View
                  </Button>

                </div>

              ) : (

                <p className="text-[11px] text-muted-foreground mt-1">
                  No permit file has been uploaded yet.
                </p>

              )}

            </div>

          </div>


          <DialogFooter>

            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={saving}
            >
              {saving
                ? 'Saving…'
                : 'Save Changes'}
            </Button>

          </DialogFooter>

        </form>

      </DialogContent>

    </Dialog>
  )
}


/* =========================================================
   ARCHIVED HISTORY
========================================================= */

function ArchivedHistoryModal({
  activities,
  loading,
  onClose,
  onView,
  onRestore
}) {
  const [search, setSearch] =
    useState('')


  const filtered =
    useMemo(() => {

      const term =
        search
          .trim()
          .toLowerCase()

      const byDate = (list) =>
        [...list].sort((a, b) => {
          const timeA = new Date(
            a.archived_at || a.event_date || 0
          ).getTime()
          const timeB = new Date(
            b.archived_at || b.event_date || 0
          ).getTime()
          return timeB - timeA
        })

      if (!term) {
        return byDate(activities)
      }

      return byDate(
        activities.filter(
          activity => {

            const text = [
              activity.title,
              activity.location,
              activity.organizer,
              activity.event_type,
              activity.guest_speaker,
              normalizeDepartments(
                activity.departments
              ),
              activity.description
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()

            return text.includes(
              term
            )

          }
        )
      )

    }, [
      activities,
      search
    ])


  return (
    <Dialog
      open
      onOpenChange={onClose}
    >

      <DialogContent className="w-[min(96vw,850px)] max-w-none max-h-[90vh] overflow-y-auto">

        <DialogHeader>

          <DialogTitle className="flex items-center gap-2">

            <History className="w-5 h-5" />

            Archived Activities History

          </DialogTitle>

        </DialogHeader>


        <div className="space-y-4 py-2">

          <div className="rounded-xl bg-muted/30 border p-4">

            <div className="flex items-center justify-between gap-3">

              <div>

                <p className="text-sm font-semibold">
                  Archived Events
                </p>

                <p className="text-xs text-muted-foreground mt-0.5">
                  Archived activities are hidden from the active list but remain stored as history.
                </p>

              </div>

              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">
                {activities.length}
              </span>

            </div>

          </div>


          <div className="relative">

            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />

            <Input
              value={search}
              onChange={e =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search archived activities..."
              className="pl-9"
            />

          </div>


          {loading ? (

            <div className="space-y-2">

              {[1, 2, 3].map(i => (

                <Skeleton
                  key={i}
                  className="h-24 w-full rounded-xl"
                />

              ))}

            </div>

          ) : filtered.length === 0 ? (

            <div className="rounded-xl border border-dashed p-10 text-center">

              <Archive className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />

              <p className="text-sm font-medium">

                {activities.length === 0
                  ? 'No archived activities'
                  : 'No matching archived activities'}

              </p>

            </div>

          ) : (

            <div className="space-y-2">

              {filtered.map(
                activity => (

                  <div
                    key={activity.id}
                    className="rounded-xl border border-border/60 bg-card p-4"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">

                        <div className="flex items-center gap-2 flex-wrap">

                          <h3 className="font-semibold text-sm">
                            {activity.title}
                          </h3>

                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            Archived
                          </span>

                        </div>


                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">

                          <span className="flex items-center gap-1 text-xs text-muted-foreground">

                            <CalendarDays className="w-3.5 h-3.5" />

                            {fmt(
                              activity.event_date
                            )}

                          </span>


                          {getTimeRange(
                            activity
                          ) && (

                            <span className="flex items-center gap-1 text-xs text-muted-foreground">

                              <Clock3 className="w-3.5 h-3.5" />

                              {getTimeRange(
                                activity
                              )}

                            </span>

                          )}


                          {activity.location && (

                            <span className="flex items-center gap-1 text-xs text-muted-foreground">

                              <MapPin className="w-3.5 h-3.5" />

                              {activity.location}

                            </span>

                          )}

                        </div>


                        <div className="mt-3">

                          <ActivityDocuments
                            activity={
                              activity
                            }
                            compact
                          />

                        </div>

                      </div>


                      <div className="flex shrink-0 gap-2">

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onView(
                              activity
                            )
                          }
                        >

                          <Eye className="w-3.5 h-3.5 mr-1.5" />

                          View

                        </Button>


                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onRestore(
                              activity
                            )
                          }
                        >

                          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />

                          Restore

                        </Button>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>


        <DialogFooter>

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>
  )
}


/* =========================================================
   ARCHIVED DETAILS
========================================================= */

function ArchivedActivityDetailsModal({
  activity,
  onClose,
  onRestore
}) {
  if (!activity) {
    return null
  }

  return (
    <Dialog
      open
      onOpenChange={onClose}
    >

      <DialogContent className="max-h-[92vh] w-[min(96vw,48rem)] max-w-[calc(100%-2rem)] gap-5 overflow-y-auto p-6 sm:max-w-3xl">

        <DialogHeader>

          <DialogTitle className="flex items-center gap-2 text-xl">

            <Archive className="w-6 h-6" />

            Archived Activity

          </DialogTitle>

        </DialogHeader>


        <div className="space-y-4 py-2">

          <div className="rounded-xl bg-muted/40 border p-4">

            <h2 className="text-lg font-bold">
              {activity.title}
            </h2>

            <span className="inline-flex items-center mt-2 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Archived
            </span>

          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <div className="rounded-lg border p-3">

              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                Event Date
              </p>

              <p className="text-sm font-medium mt-1">

                {fmt(
                  activity.event_date
                )}

                {activity.end_date &&
                  normalizeDate(
                    activity.end_date
                  ) !==
                    normalizeDate(
                      activity.event_date
                    ) && (
                    <>
                      {' '}
                      -{' '}
                      {fmt(
                        activity.end_date
                      )}
                    </>
                  )}

              </p>

            </div>


            <div className="rounded-lg border p-3">

              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                Time
              </p>

              <p className="text-sm font-medium mt-1">
                {getTimeRange(
                  activity
                ) ||
                  'Not specified'}
              </p>

            </div>


            <div className="rounded-lg border p-3">

              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                Location
              </p>

              <p className="text-sm font-medium mt-1">
                {activity.location ||
                  'Not specified'}
              </p>

            </div>


            <div className="rounded-lg border p-3">

              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                Organizer
              </p>

              <p className="text-sm font-medium mt-1">
                {activity.organizer ||
                  'Not specified'}
              </p>

            </div>


            <div className="rounded-lg border p-3">

              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                Type of Event
              </p>

              <p className="text-sm font-medium mt-1">
                {activity.event_type ||
                  'Not specified'}
              </p>

            </div>


            <div className="rounded-lg border p-3">

              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                Participants
              </p>

              <p className="text-sm font-medium mt-1">
                {activity.participants ??
                  'Not specified'}
              </p>

            </div>

          </div>


          {activity.description && (

            <div className="rounded-xl border p-4">

              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                Description
              </p>

              <p className="text-sm whitespace-pre-wrap">
                {activity.description}
              </p>

            </div>

          )}


          {(activity.guest_speaker ||
            activity.guest_speakers ||
            activity.departments) && (

            <div className="rounded-xl bg-muted/30 p-4 space-y-2">

              {(activity.guest_speaker ||
                activity.guest_speakers) && (

                <div>

                  <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                    Guest Speaker
                  </p>

                  <p className="text-sm mt-1">
                    {activity.guest_speaker ||
                      activity.guest_speakers}
                  </p>

                </div>

              )}


              {activity.departments && (

                <div>

                  <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                    Departments Involved
                  </p>

                  <p className="text-sm mt-1">
                    {normalizeDepartments(
                      activity.departments
                    )}
                  </p>

                </div>

              )}

            </div>

          )}


          <ActivityDocuments
            activity={
              activity
            }
          />

        </div>


        <DialogFooter>

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>


          <Button
            type="button"
            onClick={() =>
              onRestore(
                activity
              )
            }
          >

            <RotateCcw className="w-4 h-4 mr-1.5" />

            Restore Activity

          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>
  )
}


/* =========================================================
   ATTENDANCE MODAL
========================================================= */

function AttendanceModal({
  activity,
  onClose
}) {
  const [students, setStudents] =
    useState([])

  const [roster, setRoster] =
    useState([])

  const [activityDetails, setActivityDetails] =
    useState(activity)

  const [loading, setLoading] =
    useState(true)

  const [search, setSearch] =
    useState('')

  const [courseFilter, setCourseFilter] =
    useState('all')

  const [yearFilter, setYearFilter] =
    useState('all')

  const [error, setError] =
    useState('')

  const [message, setMessage] =
    useState('')

  const [savingId, setSavingId] =
    useState(null)


  const load =
    useCallback(
      async ({
        silent = false
      } = {}) => {

        if (!silent) {
          setLoading(true)
          setError('')
          setMessage('')
        }

        try {

          const [
            studentData,
            activityData
          ] = await Promise.all([

            api.get(
              '/students/?ordering=last_name'
            ),

            api.get(
              '/activities/activities/' +
              activity.id +
              '/'
            )

          ])


          setStudents(
            studentData.results ??
            studentData ??
            []
          )


          setActivityDetails(
            activityData
          )


          setRoster(
            activityData.participations ??
            []
          )

        } catch (err) {

          setError(
            err?.message ||
            'Failed to load attendance roster.'
          )

        } finally {

          if (!silent) {
            setLoading(false)
          }

        }

      },
      [activity.id]
    )


  const refreshRoster =
    useCallback(
      async () => {

        const activityData =
          await api.get(
            '/activities/activities/' +
            activity.id +
            '/'
          )

        setActivityDetails(
          activityData
        )

        setRoster(
          activityData.participations ??
          []
        )

      },
      [activity.id]
    )


  useEffect(() => {
    load()
  }, [load])


  const involvedCourses =
    useMemo(() => {

      const fromDetails =
        parseDepartmentsList(
          activityDetails?.departments
        )

      if (fromDetails.length > 0) {
        return fromDetails
      }

      return parseDepartmentsList(
        activity?.departments
      )

    }, [
      activityDetails,
      activity
    ])


  const courseOptions =
    useMemo(() => {

      if (involvedCourses.length > 0) {
        return involvedCourses
      }

      return COURSES

    }, [involvedCourses])


  const rosterByStudentId =
    useMemo(() => {

      const map =
        new Map()

      roster.forEach(row => {

        map.set(
          row.student_detail?.student_id,
          row
        )

      })

      return map

    }, [roster])


  const filteredStudents =
    useMemo(() => {

      const term =
        search
          .trim()
          .toLowerCase()

      return students
        .filter(
          student => {

            const studentCourse =
              formatCourse(
                student.course
              )

            const inInvolvedCourses =
              involvedCourses.length === 0 ||
              involvedCourses.includes(
                studentCourse
              ) ||
              involvedCourses.includes(
                student.course
              )

            const courseMatch =
              courseFilter === 'all' ||
              studentCourse ===
                courseFilter ||
              student.course ===
                courseFilter

            const yearMatch =
              yearFilter === 'all' ||
              String(
                student.year_level
              ) === yearFilter


            if (
              !inInvolvedCourses ||
              !courseMatch ||
              !yearMatch
            ) {
              return false
            }


            if (!term) {
              return true
            }


            return [
              student.student_id,
              student.first_name,
              student.last_name,
              student.course,
              student.email
            ]
              .join(' ')
              .toLowerCase()
              .includes(term)

          }
        )
        .sort((a, b) => {
          const courseA =
            formatCourse(a.course)
          const courseB =
            formatCourse(b.course)

          const byCourse =
            courseA.localeCompare(
              courseB,
              undefined,
              { sensitivity: 'base' }
            )

          if (byCourse !== 0) {
            return byCourse
          }

          const nameA =
            `${a.last_name} ${a.first_name}`
          const nameB =
            `${b.last_name} ${b.first_name}`

          return nameA.localeCompare(
            nameB,
            undefined,
            { sensitivity: 'base' }
          )
        })

    }, [
      students,
      search,
      courseFilter,
      yearFilter,
      involvedCourses
    ])


  const attendanceStats =
    useMemo(() => {

      const total =
        filteredStudents.length

      const present =
        filteredStudents.filter(
          student =>
            rosterByStudentId.get(
              student.student_id
            )?.attendance_status ===
            'present'
        ).length

      const rate =
        total
          ? Math.round(
              (present / total) * 100
            )
          : 0

      return {
        total,
        present,
        rate
      }

    }, [
      filteredStudents,
      rosterByStudentId
    ])


  const togglePresent =
    async student => {

      const existing =
        rosterByStudentId.get(
          student.student_id
        )

      const isPresent =
        existing?.attendance_status ===
        'present'

      const previousRoster = roster

      setSavingId(
        student.student_id
      )
      setError('')

      // Optimistic UI — avoid full reload flicker
      if (isPresent && existing) {
        setRoster(current =>
          current.filter(
            row =>
              row.id !== existing.id
          )
        )
      } else if (existing) {
        setRoster(current =>
          current.map(row =>
            row.id === existing.id
              ? {
                  ...row,
                  attendance_status:
                    'present'
                }
              : row
          )
        )
      } else {
        setRoster(current => [
          ...current,
          {
            id: `temp-${student.student_id}`,
            attendance_status:
              'present',
            student:
              student.id,
            student_detail: {
              student_id:
                student.student_id,
              first_name:
                student.first_name,
              last_name:
                student.last_name,
              course:
                student.course
            }
          }
        ])
      }

      try {

        if (isPresent && existing) {

          await api.delete(
            '/activities/participations/' +
            existing.id +
            '/'
          )

        } else if (existing) {

          await api.patch(
            '/activities/participations/' +
            existing.id +
            '/',
            {
              attendance_status:
                'present'
            }
          )

        } else {

          await api.post(
            '/activities/participations/',
            {
              student:
                student.id,

              activity:
                activity.id,

              attendance_status:
                'present',

              role: '',

              attendance_note: ''
            }
          )

        }


        await refreshRoster()

      } catch (err) {

        setRoster(previousRoster)

        setError(
          err?.message ||
          'Failed to update attendance.'
        )

      } finally {

        setSavingId(null)

      }

    }


  const markAllPresent =
    async () => {

      if (
        filteredStudents.length === 0
      ) {
        return
      }

      setSavingId('bulk')
      setError('')
      setMessage('')

      const previousRoster = roster

      setRoster(current => {
        const byStudentId =
          new Map(
            current.map(row => [
              row.student_detail
                ?.student_id,
              row
            ])
          )

        filteredStudents.forEach(
          student => {
            const existing =
              byStudentId.get(
                student.student_id
              )

            if (existing) {
              byStudentId.set(
                student.student_id,
                {
                  ...existing,
                  attendance_status:
                    'present'
                }
              )
            } else {
              byStudentId.set(
                student.student_id,
                {
                  id: `temp-${student.student_id}`,
                  attendance_status:
                    'present',
                  student:
                    student.id,
                  student_detail: {
                    student_id:
                      student.student_id,
                    first_name:
                      student.first_name,
                    last_name:
                      student.last_name,
                    course:
                      student.course
                  }
                }
              )
            }
          }
        )

        return Array.from(
          byStudentId.values()
        )
      })

      try {

        const result =
          await api.post(
            '/activities/participations/bulk-add/',
            {
              activity:
                activity.id,

              student_ids:
                filteredStudents.map(
                  student =>
                    student.id
                ),

              attendance_status:
                'present',

              course:
                courseFilter !== 'all'
                  ? courseFilter
                  : '',

              year_level:
                yearFilter !== 'all'
                  ? yearFilter
                  : ''
            }
          )


        await refreshRoster()


        setMessage(
          'Marked ' +
          (
            (result.created ?? 0) +
            (result.updated ?? 0)
          ) +
          ' students present.'
        )

      } catch (err) {

        setRoster(previousRoster)

        setError(
          err?.message ||
          'Failed to mark students present.'
        )

      } finally {

        setSavingId(null)

      }

    }


  const clearAllAttendance =
    async () => {

      if (roster.length === 0) {
        return
      }

      const confirmed = window.confirm(
        'Clear all attendance marks for this activity?'
      )

      if (!confirmed) {
        return
      }

      setSavingId('bulk-clear')
      setError('')
      setMessage('')

      const previousRoster = roster
      setRoster([])

      try {

        const result =
          await api.post(
            '/activities/participations/bulk-clear/',
            {
              activity:
                activity.id
            }
          )


        await refreshRoster()


        setMessage(
          'Cleared ' +
          (result.deleted ?? 0) +
          ' attendance marks.'
        )

      } catch (err) {

        setRoster(previousRoster)

        setError(
          err?.message ||
          'Failed to clear attendance.'
        )

      } finally {

        setSavingId(null)

      }

    }


  return (
    <Dialog
      open
      onOpenChange={onClose}
    >

      <DialogContent className="max-h-[92vh] w-[min(96vw,72rem)] max-w-[calc(100%-2rem)] gap-5 overflow-y-auto p-6 sm:max-w-6xl">

        <DialogHeader>

          <DialogTitle className="flex items-center gap-2 text-xl">

            <Users className="w-5 h-5" />

            Attendance Checker —{' '}

            {activity.title}

          </DialogTitle>

          {involvedCourses.length > 0 && (

            <p className="text-sm text-muted-foreground">
              Showing students from:{' '}
              <span className="font-medium text-foreground">
                {involvedCourses.join(', ')}
              </span>
            </p>

          )}

        </DialogHeader>


        <div className="space-y-4">


          <div className="grid grid-cols-3 gap-3">

            <div className="rounded-xl border p-4">

              <p className="text-[11px] uppercase font-semibold text-muted-foreground">
                Students
              </p>

              <p className="text-2xl font-bold">
                {attendanceStats.total}
              </p>

            </div>


            <div className="rounded-xl border p-4">

              <p className="text-[11px] uppercase font-semibold text-muted-foreground">
                Present
              </p>

              <p className="text-2xl font-bold text-emerald-600">
                {attendanceStats.present}
              </p>

            </div>


            <div className="rounded-xl border p-4">

              <p className="text-[11px] uppercase font-semibold text-muted-foreground">
                Attendance
              </p>

              <p className="text-2xl font-bold">
                {attendanceStats.rate}%
              </p>

            </div>

          </div>


          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">

            <Select
              value={courseFilter}
              onValueChange={
                setCourseFilter
              }
            >

              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>

                <SelectItem value="all">
                  {involvedCourses.length > 0
                    ? 'All involved courses'
                    : 'All courses'}
                </SelectItem>

                {courseOptions.map(
                  course => (

                    <SelectItem
                      key={course}
                      value={course}
                    >
                      {course}
                    </SelectItem>

                  )
                )}

              </SelectContent>

            </Select>


            <Select
              value={yearFilter}
              onValueChange={
                setYearFilter
              }
            >

              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>

                <SelectItem value="all">
                  All years
                </SelectItem>

                {YEAR_LEVELS.map(
                  year => (

                    <SelectItem
                      key={year}
                      value={year}
                    >
                      {year} Year
                    </SelectItem>

                  )
                )}

              </SelectContent>

            </Select>


            <Button
              type="button"
              variant="outline"
              onClick={
                markAllPresent
              }
              disabled={
                savingId === 'bulk' ||
                savingId === 'bulk-clear' ||
                loading ||
                filteredStudents.length === 0
              }
            >

              {savingId === 'bulk'
                ? 'Marking…'
                : 'Mark All Present'}

            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={
                clearAllAttendance
              }
              disabled={
                savingId === 'bulk' ||
                savingId === 'bulk-clear' ||
                loading ||
                roster.length === 0
              }
              className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
            >

              {savingId === 'bulk-clear'
                ? 'Clearing…'
                : 'Clear All'}

            </Button>

          </div>


          <div className="relative">

            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={e =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search students..."
              className="pl-9"
            />

          </div>


          {error && (

            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>

          )}


          {message && (

            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>

          )}


          <div>

            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Students
            </p>


            <div className="max-h-[52vh] overflow-y-auto space-y-2 rounded-xl border p-2">

              {loading ? (

                <Skeleton className="h-20 w-full rounded-xl" />

              ) : filteredStudents.length === 0 ? (

                <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No students found.
                </div>

              ) : (

                filteredStudents.map(
                  student => {

                    const existing =
                      rosterByStudentId.get(
                        student.student_id
                      )

                    const isPresent =
                      existing?.attendance_status ===
                      'present'

                    const busy =
                      savingId ===
                        student.student_id ||
                      savingId === 'bulk' ||
                      savingId === 'bulk-clear'


                    return (

                      <button
                        type="button"
                        key={student.id}
                        onClick={() =>
                          togglePresent(
                            student
                          )
                        }
                        disabled={busy}
                        className={
                          'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ' +
                          (
                            isPresent
                              ? 'border-emerald-200 bg-emerald-50/70'
                              : 'hover:bg-muted/40'
                          )
                        }
                      >

                        <span
                          className={
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ' +
                            (
                              isPresent
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-border bg-background text-transparent'
                            )
                          }
                        >

                          <CheckCircle2 className="h-4 w-4" />

                        </span>


                        <div className="min-w-0 flex-1">

                          <p className="font-medium truncate">

                            {student.first_name}{' '}

                            {student.last_name}

                          </p>

                          <p className="text-xs text-muted-foreground">

                            {student.student_id}

                            {' · '}

                            {formatCourse(student.course)}

                          </p>

                        </div>


                        <span
                          className={
                            'shrink-0 text-xs font-medium ' +
                            (
                              isPresent
                                ? 'text-emerald-700'
                                : 'text-muted-foreground'
                            )
                          }
                        >

                          {isPresent
                            ? 'Present'
                            : 'Not marked'}

                        </span>

                      </button>

                    )

                  }
                )

              )}

            </div>

          </div>

        </div>

      </DialogContent>

    </Dialog>
  )
}


/* =========================================================
   DATE ACTIVITIES MODAL
========================================================= */

function DateActivitiesModal({
  date,
  activities,
  onClose,
  onEdit,
  onAttendance
}) {
  if (!date) {
    return null
  }

  return (
    <Dialog
      open
      onOpenChange={onClose}
    >

      <DialogContent className="max-h-[92vh] w-[min(96vw,52rem)] max-w-[calc(100%-2rem)] gap-5 overflow-y-auto p-6 sm:max-w-4xl">

        <DialogHeader>

          <DialogTitle className="flex items-center gap-2 text-xl">

            <CalendarDays className="w-6 h-6 text-primary" />

            {date.toLocaleDateString(
              'en-PH',
              {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              }
            )}

          </DialogTitle>

        </DialogHeader>


        <div className="space-y-4">

          {activities.length === 0 ? (

            <div className="rounded-2xl border border-dashed p-10 text-center">

              <CalendarDays className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />

              <p className="text-base font-medium">
                No activities scheduled
              </p>

            </div>

          ) : (

            activities.map(
              activity => (

                <div
                  key={activity.id}
                  className="rounded-2xl border p-6 space-y-4"
                >

                  <div>

                    <h3 className="text-xl font-semibold">
                      {activity.title}
                    </h3>

                    {activity.status ===
                      'cancelled' && (

                      <span className="inline-block mt-2 rounded-full bg-rose-100 text-rose-700 px-2.5 py-1 text-xs font-semibold">
                        Cancelled
                      </span>

                    )}

                  </div>


                  <div className="space-y-2.5 text-base">

                    {getTimeRange(
                      activity
                    ) && (

                      <div className="flex items-center gap-2.5">

                        <Clock3 className="w-5 h-5 shrink-0 text-primary" />

                        {getTimeRange(
                          activity
                        )}

                      </div>

                    )}


                    {activity.location && (

                      <div className="flex items-center gap-2.5">

                        <MapPin className="w-5 h-5 shrink-0 text-primary" />

                        {activity.location}

                      </div>

                    )}


                    {activity.organizer && (

                      <div className="flex items-center gap-2.5">

                        <User className="w-5 h-5 shrink-0 text-primary" />

                        {activity.organizer}

                      </div>

                    )}


                    {activity.event_type && (

                      <div className="flex items-center gap-2.5">

                        <CalendarDays className="w-5 h-5 shrink-0 text-primary" />

                        {activity.event_type}

                      </div>

                    )}

                  </div>


                  {activity.description && (

                    <p className="text-base leading-relaxed text-muted-foreground">
                      {activity.description}
                    </p>

                  )}


                  <ActivityDocuments
                    activity={
                      activity
                    }
                  />


                  <div className="flex justify-end gap-3 pt-3 border-t">

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        onEdit(
                          activity
                        )
                      }
                    >

                      <Pencil className="w-4 h-4 mr-2" />

                      Edit

                    </Button>


                    <Button
                      type="button"
                      onClick={() =>
                        onAttendance(
                          activity
                        )
                      }
                    >

                      <Users className="w-4 h-4 mr-2" />

                      Attendance

                    </Button>

                  </div>

                </div>

              )
            )

          )}

        </div>


        <DialogFooter>

          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>
  )
}


/* =========================================================
   MINI CALENDAR
========================================================= */

function MiniCalendar({
  activities,
  year,
  month,
  onPrev,
  onNext,
  onDateClick
}) {
  const firstDay =
    new Date(
      year,
      month,
      1
    ).getDay()

  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate()

  const cells = []


  for (
    let i = 0;
    i < firstDay;
    i++
  ) {
    cells.push(null)
  }


  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    cells.push(day)
  }


  return (
    <Card className="shadow-none border-border/60 overflow-visible">

      <CardHeader className="pb-3">

        <div className="flex items-center justify-between">

          <CardTitle className="text-sm">
            {MONTHS[month]} {year}
          </CardTitle>


          <div className="flex gap-1">

            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7"
              onClick={onPrev}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>


            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7"
              onClick={onNext}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>

          </div>

        </div>

      </CardHeader>


      <CardContent>

        <div className="grid grid-cols-7 mb-2">

          {DAYS.map(day => (

            <div
              key={day}
              className="text-center text-[10px] font-semibold text-muted-foreground py-1"
            >
              {day}
            </div>

          ))}

        </div>


        <div className="grid grid-cols-7 gap-0.5">

          {cells.map(
            (day, index) => {

              if (!day) {

                return (
                  <div
                    key={index}
                  />
                )

              }


              const dayActivities =
                activities.filter(
                  activity => {

                    const d =
                      new Date(
                        activity.event_date
                      )

                    return (
                      d.getFullYear() ===
                        year &&
                      d.getMonth() ===
                        month &&
                      d.getDate() ===
                        day
                    )

                  }
                )


              const hasEvent =
                dayActivities.length >
                0


              const today =
                new Date()


              const isToday =
                today.getFullYear() ===
                  year &&
                today.getMonth() ===
                  month &&
                today.getDate() ===
                  day


              return (

                <div
                  key={index}
                  className="relative flex flex-col items-center group"
                >

                  <button
                    type="button"
                    onClick={() =>
                      onDateClick(
                        new Date(
                          year,
                          month,
                          day
                        ),
                        dayActivities
                      )
                    }
                    className={
                      'w-7 h-7 rounded-full text-xs font-medium relative z-10 ' +
                      (
                        isToday
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      )
                    }
                  >
                    {day}
                  </button>


                  {hasEvent && (
                    <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />
                  )}


                  {hasEvent && (

                    <div
                      className="
                        absolute
                        bottom-full
                        left-1/2
                        -translate-x-1/2
                        mb-2
                        hidden
                        group-hover:block
                        z-[100]
                        w-56
                        pointer-events-none
                      "
                    >

                      <div className="relative rounded-xl border border-border bg-background shadow-xl p-3">

                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">

                          <div className="flex items-center gap-1.5">

                            <CalendarDays className="w-3.5 h-3.5 text-primary" />

                            <span className="text-xs font-semibold">
                              {MONTHS[month]} {day}
                            </span>

                          </div>


                          <span className="text-[10px] text-muted-foreground">

                            {dayActivities.length}{' '}

                            {dayActivities.length === 1
                              ? 'event'
                              : 'events'}

                          </span>

                        </div>


                        <div className="mt-2 space-y-2">

                          {dayActivities
                            .slice(0, 3)
                            .map(
                              activity => (

                                <div
                                  key={
                                    activity.id
                                  }
                                  className="border-b border-border/50 last:border-b-0 pb-2 last:pb-0"
                                >

                                  <p className="text-xs font-semibold truncate">
                                    {activity.title}
                                  </p>


                                  {getTimeRange(
                                    activity
                                  ) && (

                                    <div className="flex items-center gap-1 mt-1">

                                      <Clock3 className="w-3 h-3 text-primary shrink-0" />

                                      <span className="text-[10px] text-muted-foreground truncate">
                                        {getTimeRange(
                                          activity
                                        )}
                                      </span>

                                    </div>

                                  )}


                                  {activity.location && (

                                    <div className="flex items-center gap-1 mt-0.5">

                                      <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />

                                      <span className="text-[10px] text-muted-foreground truncate">
                                        {activity.location}
                                      </span>

                                    </div>

                                  )}


                                  {activity.status ===
                                    'cancelled' && (

                                    <span className="inline-block mt-1 rounded-full bg-rose-100 text-rose-700 px-1.5 py-0.5 text-[9px] font-semibold">
                                      Cancelled
                                    </span>

                                  )}

                                </div>

                              )
                            )}

                        </div>


                        {dayActivities.length >
                          3 && (

                          <p className="text-[10px] text-muted-foreground text-center mt-2 pt-2 border-t border-border/50">

                            +
                            {dayActivities.length -
                              3}{' '}

                            more event

                            {dayActivities.length -
                              3 === 1
                              ? ''
                              : 's'}

                          </p>

                        )}


                        <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 rotate-45 bg-background border-r border-b border-border" />

                      </div>

                    </div>

                  )}

                </div>

              )

            }
          )}

        </div>

      </CardContent>

    </Card>
  )
}


/* =========================================================
   MAIN ACTIVITIES PAGE
========================================================= */

export default function Activities() {

  const [activities, setActivities] =
    useState([])

  const [archivedActivities, setArchivedActivities] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [archiveLoading, setArchiveLoading] =
    useState(false)

  const [loadError, setLoadError] =
    useState('')

  const [showAdd, setShowAdd] =
    useState(false)

  const [showArchiveHistory, setShowArchiveHistory] =
    useState(false)

  const [viewArchivedActivity, setViewArchivedActivity] =
    useState(null)

  const [editActivity, setEditActivity] =
    useState(null)

  const [attendanceActivity, setAttendanceActivity] =
    useState(null)

  const [selectedDate, setSelectedDate] =
    useState(null)

  const [
    selectedDateActivities,
    setSelectedDateActivities
  ] = useState([])


  /* =====================================================
     SELECTED STATUS
  ===================================================== */

  const [selectedStatus, setSelectedStatus] =
    useState(() => {

      try {

        const saved =
          localStorage.getItem(
            'activitiesSelectedStatus'
          )

        if (
          saved === 'total' ||
          saved === 'upcoming' ||
          saved === 'cancelled'
        ) {
          return saved
        }

      } catch (error) {

        console.error(
          'Failed to read saved activity status:',
          error
        )

      }

      return null
    })


  /* =====================================================
     SAVE SELECTED STATUS
  ===================================================== */

  useEffect(() => {

    try {

      if (selectedStatus) {

        localStorage.setItem(
          'activitiesSelectedStatus',
          selectedStatus
        )

      } else {

        localStorage.removeItem(
          'activitiesSelectedStatus'
        )

      }

    } catch (error) {

      console.error(
        'Failed to save activity status:',
        error
      )

    }

  }, [selectedStatus])


  const [calYear, setCalYear] =
    useState(
      new Date().getFullYear()
    )

  const [calMonth, setCalMonth] =
    useState(
      new Date().getMonth()
    )


  /* =====================================================
     LOAD ACTIVE ACTIVITIES
  ===================================================== */

  const load =
    useCallback(
      async () => {

        setLoading(true)
        setLoadError('')

        try {

          const results =
            await fetchAllActivities()


          const active =
            results.filter(
              activity =>
                activity.archived !== true
            )


          active.sort(
            (a, b) =>
              new Date(
                a.event_date
              ) -
              new Date(
                b.event_date
              )
          )


          setActivities(
            active
          )

        } catch (err) {

          console.error(
            'Failed to load activities:',
            err
          )

          setLoadError(
            err?.message ||
            'Failed to load activities.'
          )

        } finally {

          setLoading(false)

        }

      },
      []
    )


  /* =====================================================
     LOAD ARCHIVED
  ===================================================== */

  const loadArchived =
    useCallback(
      async () => {

        setArchiveLoading(true)

        try {

          const results =
            await fetchAllActivities()


          const archived =
            results.filter(
              activity =>
                activity.archived === true
            )


          archived.sort(
            (a, b) =>
              new Date(
                b.archived_at
              ) -
              new Date(
                a.archived_at
              )
          )


          setArchivedActivities(
            archived
          )

        } catch (err) {

          console.error(
            'Failed to load archived activities:',
            err
          )

        } finally {

          setArchiveLoading(false)

        }

      },
      []
    )


  useEffect(() => {
    load()
  }, [load])


  /* =====================================================
     ARCHIVE
  ===================================================== */

  const archiveActivity =
    async activity => {

      const confirmed =
        window.confirm(
          'Are you sure you want to archive "' +
          activity.title +
          '"?'
        )


      if (!confirmed) {
        return
      }


      try {

        await api.patch(
          '/activities/activities/' +
          activity.id +
          '/',
          {
            archived: true
          }
        )


        setActivities(
          previous =>
            previous.filter(
              item =>
                item.id !==
                activity.id
            )
        )


        await load()

      } catch (err) {

        console.error(
          'Failed to archive activity:',
          err
        )

        window.alert(
          err?.message ||
          'Failed to archive activity.'
        )

      }

    }


  /* =====================================================
     CANCEL ACTIVITY
  ===================================================== */

  const cancelActivity =
    async activity => {

      if (
        activity.status ===
        'cancelled'
      ) {
        return
      }


      const confirmed =
        window.confirm(
          'Are you sure you want to cancel "' +
          activity.title +
          '"?'
        )


      if (!confirmed) {
        return
      }


      try {

        await api.patch(
          '/activities/activities/' +
          activity.id +
          '/',
          {
            status: 'cancelled'
          }
        )


        setActivities(
          previous =>
            previous.map(
              item =>
                item.id ===
                activity.id
                  ? {
                      ...item,
                      status:
                        'cancelled'
                    }
                  : item
            )
        )


        await load()

      } catch (err) {

        console.error(
          'Failed to cancel activity:',
          err
        )

        window.alert(
          err?.message ||
          'Failed to cancel activity.'
        )

      }

    }


  /* =====================================================
     RESTORE
  ===================================================== */

  const restoreActivity =
    async activity => {

      const confirmed =
        window.confirm(
          'Restore "' +
          activity.title +
          '" back to the active activities?'
        )


      if (!confirmed) {
        return
      }


      try {

        await api.patch(
          '/activities/activities/' +
          activity.id +
          '/',
          {
            archived: false
          }
        )


        setArchivedActivities(
          previous =>
            previous.filter(
              item =>
                item.id !==
                activity.id
            )
        )


        setViewArchivedActivity(
          null
        )


        setShowArchiveHistory(
          false
        )


        await load()

      } catch (err) {

        console.error(
          'Failed to restore activity:',
          err
        )

        window.alert(
          err?.message ||
          'Failed to restore activity.'
        )

      }

    }


  /* =====================================================
     TOTAL / UPCOMING / CANCELLED
  ===================================================== */

  const cancelledCount =
    useMemo(
      () =>
        activities.filter(
          activity =>
            activity.status ===
            'cancelled'
        ).length,
      [activities]
    )


  const upcomingCount =
    useMemo(() => {

      const today =
        new Date()


      const todayOnly =
        new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        )


      return activities.filter(
        activity => {

          const date =
            new Date(
              activity.event_date
            )


          const dateOnly =
            new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate()
            )


          return (
            dateOnly >=
            todayOnly
          )

        }
      ).length

    }, [activities])


  /* =====================================================
     FILTERED STATUS ACTIVITIES
  ===================================================== */

  const selectedStatusActivities =
    useMemo(() => {

      if (!selectedStatus) {
        return []
      }


      if (
        selectedStatus ===
        'total'
      ) {
        return activities
      }


      if (
        selectedStatus ===
        'cancelled'
      ) {

        return activities.filter(
          activity =>
            activity.status ===
            'cancelled'
        )

      }


      if (
        selectedStatus ===
        'upcoming'
      ) {

        const today =
          new Date()


        const todayOnly =
          new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
          )


        return activities.filter(
          activity => {

            const date =
              new Date(
                activity.event_date
              )


            const dateOnly =
              new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
              )


            return (
              dateOnly >=
              todayOnly
            )

          }
        )

      }


      return []

    }, [
      activities,
      selectedStatus
    ])


  /* =====================================================
     CLICK STATUS
  ===================================================== */

  const toggleStatus =
    status => {

      setSelectedStatus(
        previous =>
          previous === status
            ? null
            : status
      )

    }


  /* =====================================================
     EDIT ACTIVITY
  ===================================================== */

  const handleEditActivity =
    activity => {

      /*
        DO NOT change selectedStatus.

        The selected panel stays visible
        behind the edit modal.
      */

      setEditActivity(
        activity
      )

    }


  /* =====================================================
     ATTENDANCE
  ===================================================== */

  const handleAttendanceActivity =
    activity => {

      /*
        DO NOT change selectedStatus.
      */

      setAttendanceActivity(
        activity
      )

    }


  /* =====================================================
     AFTER EDIT IS SAVED
  ===================================================== */

  const handleActivitySaved =
    useCallback(
      async () => {

        /*
          Reload the activities.

          We intentionally do NOT do:

          setSelectedStatus(null)

          or:

          setSelectedStatus('total')

          Therefore the currently
          selected status remains selected.
        */

        await load()

      },
      [load]
    )


  /* =====================================================
     CALENDAR
  ===================================================== */

  const prevMonth =
    () => {

      if (
        calMonth === 0
      ) {

        setCalMonth(11)

        setCalYear(
          year =>
            year - 1
        )

      } else {

        setCalMonth(
          month =>
            month - 1
        )

      }

    }


  const nextMonth =
    () => {

      if (
        calMonth === 11
      ) {

        setCalMonth(0)

        setCalYear(
          year =>
            year + 1
        )

      } else {

        setCalMonth(
          month =>
            month + 1
        )

      }

    }


  /* =====================================================
     DATE CLICK
  ===================================================== */

  const handleDateClick =
    (
      date,
      dayActivities
    ) => {

      setSelectedDate(
        date
      )

      setSelectedDateActivities(
        dayActivities
      )

    }


  const closeDateModal =
    () => {

      setSelectedDate(
        null
      )

      setSelectedDateActivities(
        []
      )

    }


  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="p-6 space-y-5 max-w-screen-2xl">


      {/* HEADER */}

      <div className="flex items-center justify-between gap-3">

        <div>

          <h1 className="text-2xl font-bold">
            Calendar Activities
          </h1>

          <p className="text-sm text-muted-foreground mt-0.5">
            Schedule and track SASO events and activities
          </p>

        </div>


        <div className="flex items-center gap-2">

          <Button
            variant="outline"
            onClick={() => {

              setShowArchiveHistory(
                true
              )

              loadArchived()

            }}
            className="gap-2"
          >

            <History className="w-4 h-4" />

            Archived History

          </Button>


          <Button
            onClick={() =>
              setShowAdd(true)
            }
            className="gap-2"
          >

            <Plus className="w-4 h-4" />

            Add Activity

          </Button>

        </div>

      </div>


      {/* ERROR */}

      {loadError && (

        <div className="rounded-xl border border-destructive/20 bg-destructive/10 text-destructive px-4 py-3 text-sm">

          {loadError}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-3"
            onClick={load}
          >
            Retry
          </Button>

        </div>

      )}


      {/* MAIN LAYOUT */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


        {/* LEFT */}

        <div className="space-y-4">

          <MiniCalendar
            activities={
              activities
            }
            year={
              calYear
            }
            month={
              calMonth
            }
            onPrev={
              prevMonth
            }
            onNext={
              nextMonth
            }
            onDateClick={
              handleDateClick
            }
          />


          {/* COUNTERS */}

          <Card className="shadow-none">

            <CardContent className="p-3">

              <div className="grid grid-cols-3 gap-1">


                {/* TOTAL */}

                <button
                  type="button"
                  onClick={() =>
                    toggleStatus(
                      'total'
                    )
                  }
                  className={
                    'rounded-lg p-3 text-center border transition-all ' +
                    (
                      selectedStatus ===
                      'total'
                        ? 'bg-primary/10 border-primary shadow-sm'
                        : 'border-transparent hover:bg-muted/70'
                    )
                  }
                >

                  <p className="text-2xl font-bold">
                    {activities.length}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Total
                  </p>

                </button>


                {/* UPCOMING */}

                <button
                  type="button"
                  onClick={() =>
                    toggleStatus(
                      'upcoming'
                    )
                  }
                  className={
                    'rounded-lg p-3 text-center border transition-all ' +
                    (
                      selectedStatus ===
                      'upcoming'
                        ? 'bg-primary/10 border-primary shadow-sm'
                        : 'border-transparent hover:bg-muted/70'
                    )
                  }
                >

                  <p className="text-2xl font-bold text-primary">
                    {upcomingCount}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Upcoming
                  </p>

                </button>


                {/* CANCELLED */}

                <button
                  type="button"
                  onClick={() =>
                    toggleStatus(
                      'cancelled'
                    )
                  }
                  className={
                    'rounded-lg p-3 text-center border transition-all ' +
                    (
                      selectedStatus ===
                      'cancelled'
                        ? 'bg-rose-50 border-rose-300 shadow-sm'
                        : 'border-transparent hover:bg-muted/70'
                    )
                  }
                >

                  <p className="text-2xl font-bold text-rose-600">
                    {cancelledCount}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Cancelled
                  </p>

                </button>

              </div>

            </CardContent>

          </Card>

        </div>


        {/* RIGHT */}

        <div className="lg:col-span-2 min-w-0">

          {loading ? (

            <div className="space-y-2">

              {[1, 2, 3, 4].map(
                i => (

                  <Skeleton
                    key={i}
                    className="h-24 w-full rounded-xl"
                  />

                )
              )}

            </div>

          ) : (

            <>


              {/* SELECTED STATUS PANEL */}

              {selectedStatus && (

                <StatusActivitiesPanel
                  status={
                    selectedStatus
                  }

                  activities={
                    selectedStatusActivities
                  }

                  onClose={() =>
                    setSelectedStatus(
                      null
                    )
                  }

                  onEdit={
                    handleEditActivity
                  }

                  onAttendance={
                    handleAttendanceActivity
                  }

                />

              )}


              {/* NORMAL LIST */}

              {!selectedStatus &&
                activities.length > 0 && (

                <div>

                  <div className="flex items-center justify-between mb-3">

                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">

                      <CalendarDays className="w-3.5 h-3.5" />

                      All Activities ({
                        activities.length
                      })

                    </p>

                    <p className="text-xs text-muted-foreground">
                      Past activities remain visible
                    </p>

                  </div>


                  <div className="space-y-2">

                    {activities.map(
                      activity => (

                        <ActivityCard
                          key={
                            activity.id
                          }

                          a={
                            activity
                          }

                          onClick={() =>
                            setEditActivity(
                              activity
                            )
                          }

                          onArchive={
                            archiveActivity
                          }

                          onCancel={
                            cancelActivity
                          }

                          onAttendance={
                            handleAttendanceActivity
                          }

                        />

                      )
                    )}

                  </div>

                </div>

              )}


              {/* EMPTY */}

              {!selectedStatus &&
                activities.length ===
                  0 && (

                <div className="flex flex-col items-center justify-center py-16 text-center">

                  <CalendarDays className="w-10 h-10 text-muted-foreground/40 mb-3" />

                  <p className="text-sm text-muted-foreground">
                    No activities scheduled yet.
                  </p>

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() =>
                      setShowAdd(true)
                    }
                  >

                    <Plus className="w-4 h-4 mr-1.5" />

                    Add First Activity

                  </Button>

                </div>

              )}

            </>

          )}

        </div>

      </div>


      {/* DATE MODAL */}

      {selectedDate && (

        <DateActivitiesModal
          date={
            selectedDate
          }

          activities={
            selectedDateActivities
          }

          onClose={
            closeDateModal
          }

          onEdit={
            activity => {

              closeDateModal()

              setEditActivity(
                activity
              )

            }
          }

          onAttendance={
            activity => {

              closeDateModal()

              handleAttendanceActivity(
                activity
              )

            }
          }

        />

      )}


      {/* ARCHIVED HISTORY */}

      {showArchiveHistory && (

        <ArchivedHistoryModal
          activities={
            archivedActivities
          }

          loading={
            archiveLoading
          }

          onClose={() =>
            setShowArchiveHistory(
              false
            )
          }

          onView={
            activity =>
              setViewArchivedActivity(
                activity
              )
          }

          onRestore={
            restoreActivity
          }

        />

      )}


      {/* ARCHIVED DETAILS */}

      {viewArchivedActivity && (

        <ArchivedActivityDetailsModal
          activity={
            viewArchivedActivity
          }

          onClose={() =>
            setViewArchivedActivity(
              null
            )
          }

          onRestore={
            restoreActivity
          }

        />

      )}


      {/* ADD */}

      {showAdd && (

        <AddActivityModal
          onClose={() =>
            setShowAdd(
              false
            )
          }

          onSaved={
            load
          }

        />

      )}


      {/* EDIT */}

      {editActivity && (

        <EditActivityModal
          activity={
            editActivity
          }

          onClose={() =>
            setEditActivity(
              null
            )
          }

          onSaved={
            handleActivitySaved
          }

        />

      )}


      {/* ATTENDANCE */}

      {attendanceActivity && (

        <AttendanceModal
          activity={
            attendanceActivity
          }

          onClose={() =>
            setAttendanceActivity(
              null
            )
          }

        />

      )}

    </div>
  )
}