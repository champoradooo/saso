import { useEffect, useState, useCallback, useRef } from 'react'
import { api } from '../api/client'

import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

import { Skeleton } from '@/components/ui/skeleton'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  Search,
  Plus,
  Eye,
  Pencil,
  Users,
  CheckCircle2,
  Clock,
  X,
  Upload,
  Archive,
} from 'lucide-react'


/* =========================================================
   CONSTANTS
========================================================= */

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

const STATUS_PILL = {
  completed:
    'bg-green-50 text-green-700 border-green-200',

  pending:
    'bg-amber-50 text-amber-700 border-amber-200',
}


/* =========================================================
   FORM FIELD
========================================================= */

function FormField({
  label,
  id,
  type = 'text',
  required,
  form,
  errors,
  set,
  disabled = false,
}) {
  return (
    <div className="w-full min-w-0">

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
        value={form[id] || ''}
        onChange={(e) =>
          set(id, e.target.value)
        }
        disabled={disabled}
        readOnly={disabled}
        className={`w-full ${
          errors[id]
            ? 'border-destructive'
            : ''
        } ${
          disabled
            ? 'bg-muted/60 cursor-not-allowed opacity-80'
            : ''
        }`}
      />

      {errors[id] && (
        <p className="text-xs text-destructive mt-1">
          {errors[id]}
        </p>
      )}

    </div>
  )
}


/* =========================================================
   TABLE SKELETON
========================================================= */

function TableSkeleton() {
  return [...Array(6)].map((_, i) => (
    <tr
      key={i}
      className="border-b border-border/40"
    >
      {[...Array(6)].map((_, j) => (
        <td
          key={j}
          className="px-5 py-4"
        >
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  ))
}


/* =========================================================
   STUDENT DETAIL MODAL
========================================================= */

function StudentDetailModal({
  student,
  onClose,
}) {
  if (!student) return null

  const getYearLabel = (year) => {
    const value = String(year)

    if (value === '1')
      return '1st Year'

    if (value === '2')
      return '2nd Year'

    if (value === '3')
      return '3rd Year'

    if (value === '4')
      return '4th Year'

    return value
  }

  const isArchived =
    student.is_archived === true

  return (
    <Dialog
      open
      onOpenChange={onClose}
    >

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">

        <DialogHeader>

          <DialogTitle className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center font-bold text-primary text-sm shrink-0">

              {student.first_name?.[0]}
              {student.last_name?.[0]}

            </div>

            <div className="min-w-0">

              <p className="truncate">

                {student.first_name}{' '}
                {student.last_name}

              </p>

              <p className="text-xs font-normal text-muted-foreground">

                {student.student_id}

              </p>

            </div>

          </DialogTitle>

        </DialogHeader>


        <div className="space-y-4 py-2">

          <div className="grid grid-cols-2 gap-4">

            <div className="min-w-0">

              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Course
              </p>

              <p className="text-sm break-words">
                {formatCourse(student.course)}
              </p>

            </div>


            <div className="min-w-0">

              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Year Level
              </p>

              <p className="text-sm">

                {getYearLabel(
                  student.year_level
                )}

              </p>

            </div>

          </div>


          <div className="w-full min-w-0">

            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Email
            </p>

            <p className="text-sm break-all">

              {student.email || '—'}

            </p>

          </div>


          <div>

            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Status
            </p>


            {isArchived ? (

              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border bg-gray-50 text-gray-700 border-gray-200">

                Archived

              </span>

            ) : (

              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                  STATUS_PILL[
                    student.status
                  ] ||
                  'bg-gray-50 text-gray-700 border-gray-200'
                }`}
              >

                {student.status ===
                'completed'
                  ? 'Completed'
                  : 'Pending'}

              </span>

            )}

          </div>


          {isArchived && (

            <div>

              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Archive Reason
              </p>

              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200">

                {student.archive_reason ||
                  'Not specified'}

              </span>

            </div>

          )}


          {isArchived &&
            student.archived_date && (

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Archived Date
                </p>

                <p className="text-sm">
                  {student.archived_date}
                </p>

              </div>

            )}


          <div className="w-full min-w-0">

            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Address
            </p>

            <p className="text-sm break-words whitespace-normal">

              {student.address || '—'}

            </p>

          </div>


          <div className="w-full min-w-0">

            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Phone
            </p>

            <p className="text-sm break-all">

              {student.phone || '—'}

            </p>

          </div>

        </div>

      </DialogContent>

    </Dialog>
  )
}


/* =========================================================
   ADD / EDIT STUDENT MODAL
========================================================= */

function StudentFormModal({
  student,
  onClose,
  onSaved,
}) {

  const isEditing = Boolean(student)

  const [form, setForm] =
    useState({
      student_id:
        student?.student_id || '',

      first_name:
        student?.first_name || '',

      last_name:
        student?.last_name || '',

      middle_name:
        student?.middle_name || '',

      course: student?.course
        ? COURSE_LABELS[student.course] ||
          student.course
        : '',

      year_level:
        student?.year_level
          ? String(student.year_level)
          : '',

      address:
        student?.address || '',

      email:
        student?.email || '',

      phone:
        student?.phone || '',

      status:
        student?.status || 'pending',
    })


  const [saving, setSaving] =
    useState(false)

  const [errors, setErrors] =
    useState({})


  const set = (key, value) => {

    setForm((current) => ({
      ...current,
      [key]: value,
    }))

  }


  const validate = () => {

    const e = {}


    if (!form.student_id.trim())
      e.student_id = 'Required'


    if (!form.first_name.trim())
      e.first_name = 'Required'


    if (!form.last_name.trim())
      e.last_name = 'Required'


    if (!form.course)
      e.course = 'Required'


    if (!form.year_level)
      e.year_level = 'Required'


    if (!form.address.trim())
      e.address = 'Required'


    return e

  }


  const handleSubmit = async (e) => {

    e.preventDefault()


    const validationErrors =
      validate()


    if (
      Object.keys(
        validationErrors
      ).length
    ) {

      setErrors(
        validationErrors
      )

      return

    }


    setSaving(true)
    setErrors({})


    try {

      const payload = {
        ...form,

        year_level:
          Number(
            form.year_level
          ),
      }


      if (isEditing) {

        await api.patch(
          `/students/${student.id}/`,
          payload
        )

      } else {

        await api.post(
          '/students/',
          payload
        )

      }


      await onSaved()

      onClose()


    } catch (error) {

      console.error(
        isEditing
          ? 'Failed to update student:'
          : 'Failed to save student:',
        error
      )


      const backendData =
        error?.data


      if (
        backendData &&
        typeof backendData ===
          'object'
      ) {

        const fieldErrors = {}

        Object.entries(
          backendData
        ).forEach(
          ([key, value]) => {

            if (
              key === 'detail'
            ) {

              fieldErrors.__root =
                Array.isArray(value)
                  ? value.join(', ')
                  : String(value)

            } else {

              fieldErrors[key] =
                Array.isArray(value)
                  ? value.join(', ')
                  : String(value)

            }

          }
        )


        if (
          Object.keys(
            fieldErrors
          ).length > 0
        ) {

          setErrors(
            fieldErrors
          )

        } else {

          setErrors({
            __root:
              isEditing
                ? 'Failed to update student. Please try again.'
                : 'Failed to save student. Student ID may already exist.',
          })

        }

      } else {

        setErrors({
          __root:
            isEditing
              ? 'Failed to update student. Please try again.'
              : 'Failed to save student. Student ID may already exist.',
        })

      }

    } finally {

      setSaving(false)

    }

  }


  return (

    <Dialog
      open
      onOpenChange={onClose}
    >

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">

        <DialogHeader>

          <DialogTitle>

            {isEditing
              ? 'Edit Student'
              : 'Add New Student'}

          </DialogTitle>

        </DialogHeader>


        <form
          onSubmit={handleSubmit}
          className="space-y-5 py-2"
        >

          {errors.__root && (

            <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3">

              {errors.__root}

            </div>

          )}


          <div className="grid grid-cols-2 gap-4">

            <FormField
              label="Student ID"
              id="student_id"
              required
              form={form}
              errors={errors}
              set={set}
              disabled={isEditing}
            />


            <div>

              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">

                Status

                <span className="text-destructive ml-0.5">
                  *
                </span>

              </label>


              <Select
                value={form.status}
                onValueChange={(value) =>
                  set(
                    'status',
                    value
                  )
                }
              >

                <SelectTrigger>

                  <SelectValue />

                </SelectTrigger>


                <SelectContent>

                  <SelectItem value="pending">
                    Pending
                  </SelectItem>

                  <SelectItem value="completed">
                    Completed
                  </SelectItem>

                </SelectContent>

              </Select>

            </div>

          </div>


          <div className="grid grid-cols-3 gap-4">

            <FormField
              label="First Name"
              id="first_name"
              required
              form={form}
              errors={errors}
              set={set}
              disabled={isEditing}
            />


            <FormField
              label="Middle Name"
              id="middle_name"
              form={form}
              errors={errors}
              set={set}
              disabled={isEditing}
            />


            <FormField
              label="Last Name"
              id="last_name"
              required
              form={form}
              errors={errors}
              set={set}
              disabled={isEditing}
            />

          </div>


          <div className="grid grid-cols-2 gap-4">

            <div>

              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">

                Course

                <span className="text-destructive ml-0.5">
                  *
                </span>

              </label>


              <Select
                value={form.course}
                onValueChange={(value) =>
                  set(
                    'course',
                    value
                  )
                }
              >

                <SelectTrigger
                  className={
                    errors.course
                      ? 'border-destructive'
                      : ''
                  }
                >

                  <SelectValue placeholder="Select course" />

                </SelectTrigger>


                <SelectContent>

                  {COURSES.map(
                    (course) => (

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


              {errors.course && (

                <p className="text-xs text-destructive mt-1">
                  {errors.course}
                </p>

              )}

            </div>


            <div>

              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">

                Year Level

                <span className="text-destructive ml-0.5">
                  *
                </span>

              </label>


              <Select
                value={
                  form.year_level
                }
                onValueChange={(
                  value
                ) =>
                  set(
                    'year_level',
                    value
                  )
                }
              >

                <SelectTrigger
                  className={
                    errors.year_level
                      ? 'border-destructive'
                      : ''
                  }
                >

                  <SelectValue placeholder="Select year level" />

                </SelectTrigger>


                <SelectContent>

                  <SelectItem value="1">
                    1st Year
                  </SelectItem>

                  <SelectItem value="2">
                    2nd Year
                  </SelectItem>

                  <SelectItem value="3">
                    3rd Year
                  </SelectItem>

                  <SelectItem value="4">
                    4th Year
                  </SelectItem>

                </SelectContent>

              </Select>


              {errors.year_level && (

                <p className="text-xs text-destructive mt-1">
                  {errors.year_level}
                </p>

              )}

            </div>

          </div>


          <FormField
            label="Address"
            id="address"
            required
            form={form}
            errors={errors}
            set={set}
            disabled={isEditing}
          />


          <FormField
            label="Email"
            id="email"
            type="email"
            form={form}
            errors={errors}
            set={set}
          />


          <FormField
            label="Phone Number"
            id="phone"
            type="tel"
            form={form}
            errors={errors}
            set={set}
          />


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
                : isEditing
                ? 'Save Changes'
                : 'Add Student'}

            </Button>

          </DialogFooter>

        </form>

      </DialogContent>

    </Dialog>
  )
}


/* =========================================================
   ARCHIVE STUDENT MODAL
========================================================= */

function ArchiveStudentModal({
  student,
  onClose,
  onArchived,
}) {

  const [reason, setReason] =
    useState('')

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')


  if (!student) return null


  const handleArchive = async () => {

    if (!reason) {

      setError(
        'Please select an archive reason.'
      )

      return

    }


    setSaving(true)
    setError('')


    try {

      await api.post(
        `/students/${student.id}/archive/`,
        {
          reason,
        }
      )

      await onArchived()

      onClose()

    } catch (error) {

      console.error(
        'Failed to archive student:',
        error
      )

      setError(
        'Failed to archive student. Please try again.'
      )

    } finally {

      setSaving(false)

    }

  }


  return (

    <Dialog
      open
      onOpenChange={onClose}
    >

      <DialogContent className="max-w-md">

        <DialogHeader>

          <DialogTitle className="flex items-center gap-2">

            <Archive className="w-5 h-5 text-red-600" />

            Archive Student

          </DialogTitle>

        </DialogHeader>


        <div className="space-y-5 py-2">

          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">

            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Student
            </p>

            <p className="font-semibold">

              {student.first_name}{' '}

              {student.middle_name
                ? `${student.middle_name} `
                : ''}

              {student.last_name}

            </p>

            <p className="text-xs text-muted-foreground mt-1">

              {student.student_id}

            </p>

          </div>


          <div>

            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">

              Archive Reason

              <span className="text-destructive ml-0.5">
                *
              </span>

            </label>


            <Select
              value={reason}
              onValueChange={(value) => {
                setReason(value)
                setError('')
              }}
            >

              <SelectTrigger
                className={
                  error
                    ? 'border-destructive'
                    : ''
                }
              >

                <SelectValue placeholder="Select reason" />

              </SelectTrigger>


              <SelectContent>

                <SelectItem value="Graduated">
                  Graduated
                </SelectItem>

                <SelectItem value="Transferred">
                  Transferred
                </SelectItem>

              </SelectContent>

            </Select>


            {error && (

              <p className="text-xs text-destructive mt-1.5">
                {error}
              </p>

            )}

          </div>


          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">

            <p className="text-xs text-amber-800">

              This student will be moved to the
              <strong> Archive </strong>
              tab and will no longer appear in the
              active student records.

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
            type="button"
            variant="destructive"
            onClick={handleArchive}
            disabled={saving}
          >

            {saving
              ? 'Archiving…'
              : 'Archive Student'}

          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>
  )
}


/* =========================================================
   IMPORT STUDENTS MODAL
========================================================= */

function ImportStudentsModal({
  onClose,
  onImported,
}) {

  const fileInputRef = useRef(null)

  const [file, setFile] =
    useState(null)

  const [uploading, setUploading] =
    useState(false)

  const [error, setError] =
    useState('')


  const formatImportErrors = (
    errors
  ) => {

    if (
      !Array.isArray(errors) ||
      errors.length === 0
    ) {
      return ''
    }


    return errors
      .map((item, index) => {

        if (
          typeof item === 'string'
        ) {

          return `Row ${
            index + 1
          }: ${item}`

        }


        if (
          item &&
          typeof item === 'object'
        ) {

          const row =
            item.row
              ? `Row ${item.row}`
              : `Row ${
                  index + 1
                }`


          const studentId =
            item.student_id
              ? ` (${item.student_id})`
              : ''


          const message =
            item.error ||
            item.detail ||
            item.message ||
            item.errors ||
            JSON.stringify(item)


          return `${row}${studentId}: ${
            typeof message ===
            'string'
              ? message
              : JSON.stringify(
                  message
                )
          }`

        }


        return `Row ${
          index + 1
        }: ${String(item)}`

      })
      .join('\n')

  }


  const handleSubmit = async (e) => {

    e.preventDefault()


    if (!file) {

      setError(
        'Please choose a CSV file.'
      )

      return

    }


    setUploading(true)
    setError('')


    try {

      const formData =
        new FormData()


      formData.append(
        'file',
        file
      )


      const result =
        await api.post(
          '/students/import/',
          formData
        )


      onImported(result)
      onClose()


    } catch (err) {

      console.error(
        'CSV IMPORT ERROR:',
        err
      )


      const backendData =
        err?.data


      if (
        backendData &&
        Array.isArray(
          backendData.errors
        ) &&
        backendData.errors.length > 0
      ) {

        const formattedErrors =
          formatImportErrors(
            backendData.errors
          )


        setError(
          formattedErrors ||
            backendData.detail ||
            'Some rows could not be imported.'
        )

      } else if (
        backendData &&
        typeof backendData.detail ===
          'string'
      ) {

        const missing =
          Array.isArray(
            backendData.missing_fields
          ) &&
          backendData.missing_fields.length > 0
            ? `\nMissing columns: ${backendData.missing_fields.join(', ')}`
            : ''

        setError(
          `${backendData.detail}${missing}`
        )

      } else {

        setError(
          err?.message ||
            'Failed to import students.'
        )

      }

    } finally {

      setUploading(false)

    }

  }


  return (

    <Dialog
      open
      onOpenChange={onClose}
    >

      <DialogContent className="max-w-lg">

        <DialogHeader>

          <DialogTitle>
            Import Students
          </DialogTitle>

        </DialogHeader>


        <form
          onSubmit={handleSubmit}
          className="space-y-4 py-2"
        >

          <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm space-y-3">

            <p className="font-medium">
              Upload a UTF-8 CSV file.
            </p>


            <p className="text-xs text-muted-foreground">

              Column names are case-insensitive,
              and extra spaces are okay.

            </p>


            <div className="grid gap-3 sm:grid-cols-2">

              <div className="rounded-lg border border-border/60 bg-background/80 p-3">

                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Required
                </p>


                <p className="text-xs leading-5">

                  <code>student_id</code>,{' '}
                  <code>first_name</code>,{' '}
                  <code>last_name</code>,{' '}
                  <code>course</code>,{' '}
                  <code>year_level</code>,{' '}
                  <code>address</code>

                </p>

              </div>


              <div className="rounded-lg border border-border/60 bg-background/80 p-3">

                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Optional
                </p>


                <p className="text-xs leading-5">

                  <code>middle_name</code>,{' '}
                  <code>email</code>,{' '}
                  <code>phone</code>,{' '}
                  <code>status</code>

                </p>

              </div>

            </div>


            <div className="rounded-lg bg-background/70 px-3 py-2">

              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                CSV header
              </p>


              <p className="font-mono text-[11px] break-all">

                student_id, first_name, middle_name, last_name, course, year_level, address, email, phone, status

              </p>

            </div>

          </div>


          <div>

            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">

              CSV / Excel File

            </label>


            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              onChange={(e) => {

                setFile(
                  e.target.files?.[0] ||
                    null
                )

                setError('')

              }}
            />


            <div className="flex flex-wrap items-center gap-2">

              <Button
                type="button"
                variant="outline"
                onClick={() => {

                  if (fileInputRef.current) {
                    // Allow re-selecting the same file
                    fileInputRef.current.value = ''
                    fileInputRef.current.click()
                  }

                }}
              >

                <Upload className="w-4 h-4 mr-2" />

                {file
                  ? 'Change File'
                  : 'Choose File'}

              </Button>


              <span className="text-sm text-muted-foreground truncate max-w-[220px]">

                {file
                  ? file.name
                  : 'No file selected'}

              </span>

            </div>


            <p className="text-xs text-muted-foreground mt-2">

              Use a students CSV/XLSX with the headers above
              (not an unrelated file like orders.csv).

            </p>

          </div>


          {error && (

            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg px-4 py-3">

              <p className="font-semibold mb-2">
                Import failed
              </p>


              <div className="max-h-56 overflow-y-auto whitespace-pre-line text-xs leading-5">

                {error}

              </div>

            </div>

          )}


          <DialogFooter>

            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </Button>


            <Button
              type="submit"
              disabled={uploading || !file}
            >

              {uploading
                ? 'Importing…'
                : 'Import Students'}

            </Button>

          </DialogFooter>

        </form>

      </DialogContent>

    </Dialog>
  )
}


/* =========================================================
   MAIN STUDENTS PAGE
========================================================= */

export default function Students() {

  const [students, setStudents] =
    useState([])

  const [archivedStudents, setArchivedStudents] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [search, setSearch] =
    useState('')


  const [tab, setTab] =
    useState(() => {

      const savedTab =
        localStorage.getItem(
          'studentsTab'
        )

      return savedTab || 'all'

    })


  const [selected, setSelected] =
    useState(null)

  const [showAdd, setShowAdd] =
    useState(false)

  const [editingStudent, setEditingStudent] =
    useState(null)

  const [showImport, setShowImport] =
    useState(false)

  const [showArchive, setShowArchive] =
    useState(false)

  const [studentToArchive, setStudentToArchive] =
    useState(null)

  const [importResult, setImportResult] =
    useState(null)


  /* =======================================================
     PAGINATION
  ======================================================= */

  const RECORDS_PER_PAGE = 10

  const [currentPage, setCurrentPage] =
    useState(1)


  /* =======================================================
     SAVE SELECTED TAB
  ======================================================= */

  useEffect(() => {

    localStorage.setItem(
      'studentsTab',
      tab
    )

  }, [tab])


  /* =======================================================
     LOAD ACTIVE STUDENTS
  ======================================================= */

  const load = useCallback(() => {

    setLoading(true)

    return api
      .get('/students/')
      .then((data) => {

        setStudents(
          data.results ?? data
        )

      })
      .catch((error) => {

        console.error(
          'Failed loading students:',
          error
        )

      })
      .finally(() => {

        setLoading(false)

      })

  }, [])


  /* =======================================================
     LOAD ARCHIVED STUDENTS
  ======================================================= */

  const loadArchived = useCallback(
    async () => {

      try {

        const data =
          await api.get(
            '/students/archived/'
          )


        setArchivedStudents(
          data.results ?? data
        )

      } catch (error) {

        console.error(
          'Failed loading archive:',
          error
        )

      }

    },
    []
  )


  /* =======================================================
     OPEN ARCHIVE MODAL
  ======================================================= */

  const archiveStudent =
    (student) => {

      setStudentToArchive(
        student
      )

      setShowArchive(true)

    }


  /* =======================================================
     AFTER SUCCESSFUL ARCHIVE
  ======================================================= */

  const handleArchived =
    async () => {

      alert(
        'Student archived successfully!'
      )

      await Promise.all([
        load(),
        loadArchived(),
      ])

    }


  /* =======================================================
     UPDATE STUDENT STATUS
  ======================================================= */

  const updateStudentStatus =
    async (id, status) => {

      try {

        await api.patch(
          `/students/${id}/`,
          {
            status,
          }
        )


        setStudents(
          (currentStudents) =>
            currentStudents.map(
              (student) =>
                student.id === id
                  ? {
                      ...student,
                      status,
                    }
                  : student
            )
        )

      } catch (error) {

        console.error(
          'Failed to update student status:',
          error
        )


        alert(
          'Failed to update student status.'
        )

      }

    }


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    let cancelled = false

    Promise.all([
      api
        .get('/students/')
        .then((data) => {
          if (!cancelled) {
            setStudents(data.results ?? data)
          }
        })
        .catch((error) => {
          console.error(
            'Failed loading students:',
            error
          )
        }),
      api
        .get('/students/archived/')
        .then((data) => {
          if (!cancelled) {
            setArchivedStudents(
              data.results ?? data
            )
          }
        })
        .catch((error) => {
          console.error(
            'Failed loading archive:',
            error
          )
        }),
    ]).finally(() => {
      if (!cancelled) {
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])


  /* =======================================================
     SEARCH
  ======================================================= */

  const searchText =
    search.trim().toLowerCase()


  /* =======================================================
     FILTER ACTIVE STUDENTS
  ======================================================= */

  const filtered =
    students
      .filter((student) => {

        if (
          tab !== 'all' &&
          tab !== 'archived' &&
          student.status !== tab
        ) {
          return false
        }


        if (!searchText) {
          return true
        }


        const values = [

          student.student_id,

          student.first_name,

          student.middle_name,

          student.last_name,

          student.course,

          student.email,

          student.phone,

          student.address,

        ]


        return values.some(
          (value) =>
            String(
              value || ''
            )
              .toLowerCase()
              .includes(
                searchText
              )
        )

      })


      .sort(
        (a, b) =>
          Number(b.id) -
          Number(a.id)
      )


  /* =======================================================
     COUNTS
  ======================================================= */

  const counts = {

    all:
      students.length,

    completed:
      students.filter(
        (student) =>
          student.status ===
          'completed'
      ).length,

    pending:
      students.filter(
        (student) =>
          student.status ===
          'pending'
      ).length,

    archived:
      archivedStudents.length,

  }


  /* =======================================================
     ARCHIVED DATA
  ======================================================= */

  const archivedData =
    [...archivedStudents]
      .filter((student) => {

        if (!searchText) {
          return true
        }


        const values = [

          student.student_id,

          student.first_name,

          student.middle_name,

          student.last_name,

          student.course,

          student.email,

          student.phone,

          student.address,

          student.archive_reason,

        ]


        return values.some(
          (value) =>
            String(
              value || ''
            )
              .toLowerCase()
              .includes(
                searchText
              )
        )

      })
      .sort((a, b) => {
        const toTime = (value) => {
          if (!value) return 0
          const raw = String(value).trim()
          // Prefer date-only (YYYY-MM-DD) as local midnight
          const normalized =
            /^\d{4}-\d{2}-\d{2}$/.test(raw)
              ? `${raw}T00:00:00`
              : raw
          const time = new Date(normalized).getTime()
          return Number.isNaN(time) ? 0 : time
        }

        const dateA = toTime(a.archived_date)
        const dateB = toTime(b.archived_date)

        if (dateB !== dateA) {
          return dateB - dateA // newest archived first
        }

        return Number(b.id) - Number(a.id)
      })


  /* =======================================================
     TABLE DATA
  ======================================================= */

  const tableData =
    tab === 'archived'
      ? archivedData
      : filtered


  /* =======================================================
     PAGINATED DATA
  ======================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(
      tableData.length /
        RECORDS_PER_PAGE
    )
  )

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  )

  const startIndex =
    (safeCurrentPage - 1) *
    RECORDS_PER_PAGE

  const paginatedData =
    tableData.slice(
      startIndex,
      startIndex + RECORDS_PER_PAGE
    )

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  )


  /* =======================================================
     RETURN
  ======================================================= */

  return (

    <div className="p-6 space-y-5 max-w-screen-2xl">

      {/* HEADER */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-2xl font-bold">
            Student Records
          </h1>


          <p className="text-sm text-muted-foreground mt-0.5">

            Manage and view all enrolled student
            records

          </p>

        </div>


        <div className="flex items-center gap-2">

          <Button
            variant="outline"
            onClick={() =>
              setShowImport(true)
            }
            className="gap-2"
          >

            <Upload className="w-4 h-4" />

            Import Students

          </Button>


          <Button
            onClick={() =>
              setShowAdd(true)
            }
            className="gap-2"
          >

            <Plus className="w-4 h-4" />

            Add Student

          </Button>

        </div>

      </div>


      {/* IMPORT RESULT */}

      {importResult && (

        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            importResult.has_errors
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >

          <p className="font-medium">

            Imported{' '}

            {importResult.created}{' '}

            new student
            {importResult.created === 1
              ? ''
              : 's'}

            {importResult.updated
              ? `, updated ${importResult.updated}`
              : ''}

            .

          </p>


          {importResult.has_errors && (

            <div className="mt-2">

              <p className="text-xs font-medium mb-1">

                Some rows could not be imported:

              </p>


              {Array.isArray(
                importResult.errors
              ) &&
                importResult.errors.length >
                  0 && (

                  <div className="max-h-40 overflow-y-auto space-y-1">

                    {importResult.errors.map(
                      (item, index) => {

                        if (
                          typeof item ===
                          'string'
                        ) {

                          return (
                            <p
                              key={index}
                              className="text-xs"
                            >
                              {item}
                            </p>
                          )

                        }


                        if (
                          item &&
                          typeof item ===
                            'object'
                        ) {

                          const row =
                            item.row
                              ? `Row ${item.row}`
                              : `Row ${
                                  index +
                                  1
                                }`


                          const message =
                            item.error ||
                            item.detail ||
                            item.message ||
                            item.errors ||
                            JSON.stringify(
                              item
                            )


                          return (
                            <p
                              key={index}
                              className="text-xs"
                            >
                              <span className="font-medium">
                                {row}:
                              </span>{' '}

                              {typeof message ===
                              'string'
                                ? message
                                : JSON.stringify(
                                    message
                                  )}

                            </p>
                          )

                        }


                        return (
                          <p
                            key={index}
                            className="text-xs"
                          >
                            {String(
                              item
                            )}
                          </p>
                        )

                      }
                    )}

                  </div>

                )}

            </div>

          )}

        </div>

      )}


      {/* STATS */}

      <div className="grid grid-cols-3 gap-4">

        {[

          {
            label:
              'Total Students',

            value:
              counts.all,

            icon:
              Users,

            cls:
              'bg-emerald-100 text-emerald-600',
          },


          {
            label:
              'Completed',

            value:
              counts.completed,

            icon:
              CheckCircle2,

            cls:
              'bg-green-100 text-green-600',
          },


          {
            label:
              'Pending',

            value:
              counts.pending,

            icon:
              Clock,

            cls:
              'bg-amber-100 text-amber-600',
          },

        ].map(
          ({
            label,
            value,
            icon: Icon,
            cls,
          }) => (

            <Card
              key={label}
              className="shadow-none border-border/60"
            >

              <CardContent className="p-5 flex items-center gap-4">

                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cls}`}
                >

                  <Icon className="w-5 h-5" />

                </div>


                <div>

                  <p className="text-2xl font-bold">
                    {value}
                  </p>


                  <p className="text-xs text-muted-foreground">
                    {label}
                  </p>

                </div>

              </CardContent>

            </Card>

          )
        )}

      </div>


      {/* TABLE */}

      <Card className="shadow-none border-border/60">

        <CardHeader className="pb-3">

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">

            <Tabs
              value={tab}
              onValueChange={(value) => {

                setTab(value)
                setCurrentPage(1)


                if (
                  value ===
                  'archived'
                ) {

                  loadArchived()

                }

              }}
            >

              <TabsList className="h-8">

                <TabsTrigger
                  value="all"
                  className="text-xs px-3"
                >

                  All ({counts.all})

                </TabsTrigger>


                <TabsTrigger
                  value="completed"
                  className="text-xs px-3"
                >

                  Completed (
                  {counts.completed}
                  )

                </TabsTrigger>


                <TabsTrigger
                  value="pending"
                  className="text-xs px-3"
                >

                  Pending (
                  {counts.pending}
                  )

                </TabsTrigger>


                <TabsTrigger
                  value="archived"
                  className="text-xs px-3"
                >

                  Archive (
                  {counts.archived}
                  )

                </TabsTrigger>

              </TabsList>

            </Tabs>


            <div className="relative w-full sm:w-64">

              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />


              <Input
                placeholder="Search name, ID, course…"
                value={search}
                onChange={(e) => {
                  setSearch(
                    e.target.value
                  )
                  setCurrentPage(1)
                }}
                className="pl-8 h-8 text-sm"
              />


              {search && (

                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setCurrentPage(1)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >

                  <X className="w-3.5 h-3.5" />

                </button>

              )}

            </div>

          </div>

        </CardHeader>


        <CardContent className="px-0 pt-0">

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>

                <tr className="border-b border-border/60">

                  {[

                    'Student ID',

                    'Name',

                    'Course',

                    'Year',

                    'Status',

                    ...(tab === 'archived'
                      ? [
                          'Archive Reason',
                          'Archived Date',
                        ]
                      : []),

                    'Action',

                  ].map(
                    (header) => (

                      <th
                        key={header}
                        className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3"
                      >

                        {header}

                      </th>

                    )
                  )}

                </tr>

              </thead>


              <tbody>

                {loading ? (

                  <TableSkeleton />

                ) : tableData.length === 0 ? (

                  <tr>

                    <td
                      colSpan={
                        tab === 'archived'
                          ? 8
                          : 6
                      }
                      className="px-5 py-12 text-center text-muted-foreground text-sm"
                    >

                      {tab ===
                      'archived'
                        ? 'No archived students.'
                        : search
                        ? 'No students match your search.'
                        : 'No students found.'}

                    </td>

                  </tr>

                ) : (

                  paginatedData.map(
                    (
                      student,
                      index
                    ) => (

                      <tr
                        key={
                          student.id
                        }
                        className={`border-b border-border/40 hover:bg-muted/40 transition-colors ${
                          index % 2 !== 0
                            ? 'bg-muted/20'
                            : ''
                        }`}
                      >

                        <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">

                          {
                            student.student_id
                          }

                        </td>


                        <td className="px-5 py-3.5">

                          <div className="flex items-center gap-2.5">

                            <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 text-xs font-bold shrink-0">

                              {
                                student
                                  .first_name?.[0]
                              }

                              {
                                student
                                  .last_name?.[0]
                              }

                            </div>


                            <div className="min-w-0">

                              <p className="font-medium truncate">

                                {
                                  student.first_name
                                }{' '}

                                {
                                  student.middle_name
                                  ? `${student.middle_name} `
                                  : ''
                                }

                                {
                                  student.last_name
                                }

                              </p>


                              <p className="text-xs text-muted-foreground truncate">

                                {
                                  student.email ||
                                  '—'
                                }

                              </p>

                            </div>

                          </div>

                        </td>


                        <td className="px-5 py-3.5">

                          {
                            formatCourse(
                              student.course
                            )
                          }

                        </td>


                        <td className="px-5 py-3.5">
                       {student.year_level}
                       </td>


                        <td className="px-5 py-3.5">

                          {tab ===
                          'archived' ? (

                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border bg-gray-50 text-gray-600 border-gray-200">

                              Archived

                            </span>

                          ) : (

                            <Select
                              value={
                                student.status
                              }
                              onValueChange={(
                                value
                              ) =>
                                updateStudentStatus(
                                  student.id,
                                  value
                                )
                              }
                            >

                              <SelectTrigger
                                className={`w-[125px] h-8 text-xs font-medium rounded-full ${
                                  student.status ===
                                  'completed'
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >

                                <SelectValue />

                              </SelectTrigger>


                              <SelectContent>

                                <SelectItem value="pending">
                                  Pending
                                </SelectItem>

                                <SelectItem value="completed">
                                  Completed
                                </SelectItem>

                              </SelectContent>

                            </Select>

                          )}

                        </td>


                        {tab ===
                          'archived' && (

                          <td className="px-5 py-3.5">

                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                                student.archive_reason ===
                                'Graduated'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`}
                            >

                              {
                                student.archive_reason ||
                                'Not specified'
                              }

                            </span>

                          </td>

                        )}


                        {tab ===
                          'archived' && (

                          <td className="px-5 py-3.5 whitespace-nowrap text-muted-foreground">

                            {student.archived_date
                              ? new Date(
                                  /^\d{4}-\d{2}-\d{2}$/.test(
                                    String(
                                      student.archived_date
                                    )
                                  )
                                    ? `${student.archived_date}T00:00:00`
                                    : student.archived_date
                                ).toLocaleDateString(
                                  'en-PH',
                                  {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  }
                                )
                              : '—'}

                          </td>

                        )}


                        <td className="px-5 py-3.5">

                          <div className="flex items-center gap-1.5">

                            {/* VIEW */}

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1 text-xs"
                              onClick={() =>
                                setSelected(
                                  student
                                )
                              }
                            >

                              <Eye className="w-3.5 h-3.5" />

                              View

                            </Button>


                            {/* EDIT */}

                            {tab !==
                              'archived' && (

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs"
                                onClick={() =>
                                  setEditingStudent(
                                    student
                                  )
                                }
                              >

                                <Pencil className="w-3.5 h-3.5" />

                                Edit

                              </Button>

                            )}


                            {/* ARCHIVE */}

                            {tab !==
                              'archived' && (

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() =>
                                  archiveStudent(
                                    student
                                  )
                                }
                              >

                                <Archive className="w-3.5 h-3.5" />

                                Archive

                              </Button>

                            )}

                          </div>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>


          {!loading &&
            tableData.length > 0 && (

              <div className="border-t border-border/60 px-5 py-4">

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                  <p className="text-xs text-muted-foreground">

                    Showing{' '}

                    <span className="font-medium text-foreground">

                      {startIndex + 1}

                    </span>

                    {' '}to{' '}

                    <span className="font-medium text-foreground">

                      {Math.min(
                        startIndex +
                          RECORDS_PER_PAGE,
                        tableData.length
                      )}

                    </span>

                    {' '}of{' '}

                    <span className="font-medium text-foreground">

                      {tableData.length}

                    </span>

                    {' '}records

                  </p>


                  <div className="flex items-center justify-center gap-1">

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={
                        safeCurrentPage === 1
                      }
                      onClick={() =>
                        setCurrentPage(
                          Math.max(
                            1,
                            safeCurrentPage - 1
                          )
                        )
                      }
                      className="h-8 px-3 text-xs"
                    >

                      Previous

                    </Button>


                    {pageNumbers.map(
                      (page) => (

                        <Button
                          key={page}
                          type="button"
                          variant={
                            page ===
                            safeCurrentPage
                              ? 'default'
                              : 'ghost'
                          }
                          size="sm"
                          onClick={() =>
                            setCurrentPage(
                              page
                            )
                          }
                          className="h-8 min-w-8 px-2 text-xs rounded-md"
                        >

                          {page}

                        </Button>

                      )
                    )}


                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={
                        safeCurrentPage ===
                        totalPages
                      }
                      onClick={() =>
                        setCurrentPage(
                          Math.min(
                            totalPages,
                            safeCurrentPage + 1
                          )
                        )
                      }
                      className="h-8 px-3 text-xs"
                    >

                      Next

                    </Button>

                  </div>

                </div>

              </div>

            )}

        </CardContent>

      </Card>


      {/* ===================================================
          VIEW MODAL
      =================================================== */}

      {selected && (

        <StudentDetailModal
          student={selected}
          onClose={() =>
            setSelected(null)
          }
        />

      )}


      {/* ===================================================
          ARCHIVE MODAL
      =================================================== */}

      {showArchive &&
        studentToArchive && (

        <ArchiveStudentModal
          student={
            studentToArchive
          }

          onClose={() => {

            setShowArchive(false)

            setStudentToArchive(
              null
            )

          }}

          onArchived={
            handleArchived
          }

        />

      )}


      {/* ===================================================
          ADD / EDIT MODAL
      =================================================== */}

      {(showAdd || editingStudent) && (

        <StudentFormModal
          student={editingStudent}
          onClose={() => {
            setShowAdd(false)
            setEditingStudent(null)
          }}
          onSaved={() => {
            setShowAdd(false)
            setEditingStudent(null)
            load()
          }}
        />

      )}


      {/* ===================================================
          IMPORT MODAL
      =================================================== */}

      {showImport && (

        <ImportStudentsModal
          onClose={() =>
            setShowImport(false)
          }

          onImported={(
            result
          ) => {

            setImportResult(
              result
            )

            load()

          }}

        />

      )}

    </div>
  )
}