import {
  Fragment,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Plus,
  ChevronDown,
  ChevronUp,
  History,
  RotateCcw,
  Pencil,
  Archive,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { api } from '../api/client'

const ITEMS_PER_PAGE = 10

const EMPTY_FORM = {
  date_filing: '',
  name: '',
  year_course: '',
  item: '',
  date_time: '',
  location: '',
  contact: '',
  status: 'Not Found',
  claim_status: 'Not Claimed',
  claimant_name: '',
  claimant_course: '',
  date_claimed: '',
}

const createEmptyForm = (type = 'Lost') => ({
  ...EMPTY_FORM,
  status:
    type === 'Lost'
      ? 'Not Found'
      : 'Found',
})

function formatDate(value) {
  if (!value) return '-'

  try {
    const date = new Date(`${value}T00:00:00`)

    if (Number.isNaN(date.getTime())) {
      return value
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return value
  }
}

function formatDateTime(value) {
  if (!value) return '-'

  try {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return value
    }

    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

function formatDateTimeLocal(value) {
  if (!value) return ''

  try {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return ''
    }

    const year = date.getFullYear()
    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0')
    const day = String(
      date.getDate()
    ).padStart(2, '0')
    const hours = String(
      date.getHours()
    ).padStart(2, '0')
    const minutes = String(
      date.getMinutes()
    ).padStart(2, '0')

    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch {
    return ''
  }
}

function getErrorMessage(error) {
  if (!error) {
    return 'Something went wrong.'
  }

  if (typeof error === 'string') {
    return error
  }

  if (error?.data) {
    if (typeof error.data === 'string') {
      return error.data
    }

    if (error.data.error) {
      return String(error.data.error)
    }

    if (error.data.detail) {
      return String(error.data.detail)
    }

    if (
      typeof error.data === 'object'
    ) {
      const messages = Object.entries(
        error.data
      )
        .map(([field, value]) => {
          if (Array.isArray(value)) {
            return `${field}: ${value.join(', ')}`
          }

          if (
            typeof value === 'object' &&
            value !== null
          ) {
            return `${field}: ${JSON.stringify(value)}`
          }

          return `${field}: ${value}`
        })
        .filter(Boolean)

      if (messages.length > 0) {
        return messages.join(' | ')
      }
    }
  }

  if (error?.response?.data) {
    const data = error.response.data

    if (typeof data === 'string') {
      return data
    }

    if (data.error) {
      return String(data.error)
    }

    if (data.detail) {
      return String(data.detail)
    }

    if (
      typeof data === 'object'
    ) {
      const messages = Object.entries(
        data
      )
        .map(([field, value]) => {
          if (Array.isArray(value)) {
            return `${field}: ${value.join(', ')}`
          }

          return `${field}: ${value}`
        })
        .filter(Boolean)

      if (messages.length > 0) {
        return messages.join(' | ')
      }
    }
  }

  if (error?.message) {
    return error.message
  }

  return 'Failed to save record.'
}

function normalizeRecords(response) {
  if (Array.isArray(response)) {
    return response
  }

  if (Array.isArray(response?.results)) {
    return response.results
  }

  return []
}

export default function LostAndFound() {
  const [showItem, setShowItem] =
    useState(false)

  const [records, setRecords] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  const [search, setSearch] =
    useState('')

  const [filter, setFilter] =
    useState('All')

  const [currentPage, setCurrentPage] =
    useState(1)

  const [expanded, setExpanded] =
    useState({})

  const [showHistory, setShowHistory] =
    useState(false)

  const [historyRecords, setHistoryRecords] =
    useState([])

  const [historyLoading, setHistoryLoading] =
    useState(false)

  const [itemType, setItemType] =
    useState('Lost')

  const [editingId, setEditingId] =
    useState(null)

  const [itemForm, setItemForm] =
    useState(
      createEmptyForm('Lost')
    )

  const isEditing =
    editingId !== null

  const loadRecords = async () => {
    setLoading(true)
    setError('')

    try {
      const response =
        await api.get('/lost-found/')

      const data =
        normalizeRecords(response)

      setRecords(
        data.filter(
          (record) => !record.archived
        )
      )
    } catch (err) {
      console.error(
        'LOAD LOST & FOUND ERROR:',
        err
      )

      setError(
        getErrorMessage(err)
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecords()
  }, [])

  /*
   * Reset pagination whenever the
   * search or filter changes.
   */
  useEffect(() => {
    setCurrentPage(1)
  }, [search, filter])

  const openAddItem = () => {
    setItemType('Lost')
    setEditingId(null)

    setItemForm(
      createEmptyForm('Lost')
    )

    setError('')
    setSuccess('')

    setShowItem(true)
  }

  const openEditItem = (record) => {
    const type =
      record.item_type || 'Lost'

    setItemType(type)
    setEditingId(record.id)

    setItemForm({
      date_filing:
        record.date_filing || '',

      name:
        record.name || '',

      year_course:
        record.year_course || '',

      item:
        record.item || '',

      date_time:
        formatDateTimeLocal(
          record.date_time
        ),

      location:
        record.location || '',

      contact:
        record.contact || '',

      status:
        record.status ||
        (
          type === 'Lost'
            ? 'Not Found'
            : 'Found'
        ),

      claim_status:
        record.claim_status ||
        'Not Claimed',

      claimant_name:
        record.claimant_name || '',

      claimant_course:
        record.claimant_course || '',

      date_claimed:
        record.date_claimed || '',
    })

    setError('')
    setSuccess('')

    setShowItem(true)
  }

  const closeItemModal = () => {
    if (saving) return

    setShowItem(false)
    setEditingId(null)

    setItemForm(
      createEmptyForm('Lost')
    )

    setError('')
  }

  const changeItemType = (value) => {
    setItemType(value)

    setItemForm((previous) => ({
      ...previous,

      status:
        value === 'Lost'
          ? 'Not Found'
          : previous.claim_status ===
              'Claimed'
            ? 'Claimed'
            : 'Found',
    }))
  }

  const updateForm = (
    field,
    value
  ) => {
    setItemForm((previous) => {
      const next = {
        ...previous,
        [field]: value,
      }

      if (
        field === 'claim_status'
      ) {
        if (
          value === 'Claimed'
        ) {
          next.status = 'Claimed'
        } else {
          next.status =
            itemType === 'Lost'
              ? 'Not Found'
              : 'Found'

          next.claimant_name = ''
          next.claimant_course = ''
          next.date_claimed = ''
        }
      }

      return next
    })
  }

  const saveItem = async () => {
    if (saving) return

    setError('')
    setSuccess('')

    const dateFiling =
      itemForm.date_filing?.trim()

    const item =
      itemForm.item?.trim()

    const location =
      itemForm.location?.trim()

    if (!dateFiling) {
      setError(
        'Date Filing is required.'
      )
      return
    }

    if (!item) {
      setError(
        'Item name is required.'
      )
      return
    }

    if (!location) {
      setError(
        'Location is required.'
      )
      return
    }

    /*
     * Claimant information is required
     * only for Found + Claimed.
     */
    if (
      itemType === 'Found' &&
      itemForm.claim_status ===
        'Claimed'
    ) {
      if (
        !itemForm.claimant_name?.trim()
      ) {
        setError(
          'Claimant Name is required when the item is claimed.'
        )
        return
      }

      if (
        !itemForm.date_claimed
      ) {
        setError(
          'Date Claimed is required when the item is claimed.'
        )
        return
      }
    }

    const payload = {
      item_type:
        itemType,

      date_filing:
        dateFiling,

      name:
        itemForm.name?.trim() ||
        null,

      year_course:
        itemForm.year_course?.trim() ||
        null,

      item,

      date_time:
        itemForm.date_time ||
        null,

      location,

      contact:
        itemForm.contact?.trim() ||
        null,

      status:
        itemType === 'Found'
          ? itemForm.claim_status ===
              'Claimed'
            ? 'Claimed'
            : 'Found'
          : 'Not Found',

      claim_status:
        itemType === 'Found'
          ? itemForm.claim_status ||
            'Not Claimed'
          : 'Not Claimed',
    }

    /*
     * Only send claimant fields for
     * Found records because that matches
     * the current backend structure.
     */
    if (
      itemType === 'Found'
    ) {
      payload.claimant_name =
        itemForm.claimant_name?.trim() ||
        null

      payload.claimant_course =
        itemForm.claimant_course?.trim() ||
        null

      payload.date_claimed =
        itemForm.date_claimed ||
        null
    }

    console.log(
      isEditing
        ? 'UPDATING LOST & FOUND RECORD:'
        : 'CREATING LOST & FOUND RECORD:',
      payload
    )

    setSaving(true)

    try {
      let response
      let savedRecord

      if (isEditing) {
        response =
          await api.patch(
            `/lost-found/${editingId}/`,
            payload
          )

        savedRecord = response

        if (!savedRecord?.id) {
          throw new Error(
            'The server returned an invalid response.'
          )
        }

        setRecords(
          (previous) =>
            previous.map(
              (record) =>
                record.id ===
                editingId
                  ? savedRecord
                  : record
            )
        )

        setSuccess(
          'Lost & Found record updated successfully.'
        )
      } else {
        response =
          await api.post(
            '/lost-found/',
            payload
          )

        savedRecord = response

        if (!savedRecord?.id) {
          throw new Error(
            'The server returned an invalid response.'
          )
        }

        setRecords(
          (previous) => [
            savedRecord,
            ...previous,
          ]
        )

        setSuccess(
          'Lost & Found record saved successfully.'
        )
      }

      setShowItem(false)
      setEditingId(null)

      setItemForm(
        createEmptyForm('Lost')
      )

      setCurrentPage(1)

      await loadRecords()
    } catch (err) {
      console.error(
        isEditing
          ? 'UPDATE LOST & FOUND ERROR:'
          : 'CREATE LOST & FOUND ERROR:',
        err
      )

      setError(
        getErrorMessage(err)
      )
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (
    record,
    status
  ) => {
    setError('')
    setSuccess('')

    try {
      const response =
        await api.patch(
          `/lost-found/${record.id}/`,
          {
            status,
          }
        )

      setRecords(
        (previous) =>
          previous.map(
            (item) =>
              item.id === record.id
                ? response
                : item
          )
      )

      setSuccess(
        'Status updated successfully.'
      )
    } catch (err) {
      console.error(
        'UPDATE STATUS ERROR:',
        err
      )

      setError(
        getErrorMessage(err)
      )
    }
  }

  const updateClaimStatus = async (
    record,
    claimStatus
  ) => {
    setError('')
    setSuccess('')

    if (
      record.item_type === 'Lost'
    ) {
      setError(
        'Claim status can only be changed for Found items.'
      )
      return
    }

    try {
      const response =
        await api.patch(
          `/lost-found/${record.id}/`,
          {
            claim_status:
              claimStatus,

            status:
              claimStatus ===
              'Claimed'
                ? 'Claimed'
                : 'Found',
          }
        )

      setRecords(
        (previous) =>
          previous.map(
            (item) =>
              item.id === record.id
                ? response
                : item
          )
      )

      setSuccess(
        'Claim status updated successfully.'
      )
    } catch (err) {
      console.error(
        'UPDATE CLAIM STATUS ERROR:',
        err
      )

      setError(
        getErrorMessage(err)
      )
    }
  }

  const archiveRecord = async (
    record
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to archive "${record.item}"?`
      )

    if (!confirmed) return

    setError('')
    setSuccess('')

    try {
      await api.patch(
        `/lost-found/${record.id}/`,
        {
          archived: true,
        }
      )

      setRecords(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !== record.id
          )
      )

      setSuccess(
        'Lost & Found record archived successfully.'
      )
    } catch (err) {
      console.error(
        'ARCHIVE ERROR:',
        err
      )

      setError(
        getErrorMessage(err)
      )
    }
  }

  const loadHistory = async () => {
    setHistoryLoading(true)
    setError('')

    try {
      const response =
        await api.get(
          '/lost-found/?archived=true'
        )

      const data =
        normalizeRecords(response)

      setHistoryRecords(data)
      setShowHistory(true)
    } catch (err) {
      console.error(
        'LOAD ARCHIVE HISTORY ERROR:',
        err
      )

      setError(
        getErrorMessage(err)
      )
    } finally {
      setHistoryLoading(false)
    }
  }

  const restoreRecord = async (
    record
  ) => {
    setError('')
    setSuccess('')

    try {
      const response =
        await api.patch(
          `/lost-found/${record.id}/`,
          {
            archived: false,
          }
        )

      setHistoryRecords(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !== record.id
          )
      )

      setRecords(
        (previous) => [
          response,
          ...previous,
        ]
      )

      setCurrentPage(1)

      setSuccess(
        'Record restored successfully.'
      )
    } catch (err) {
      console.error(
        'RESTORE ERROR:',
        err
      )

      setError(
        getErrorMessage(err)
      )
    }
  }

  const filteredRecords =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      return records.filter(
        (record) => {
          const matchesFilter =
            filter === 'All' ||
            record.item_type ===
              filter

          if (
            !matchesFilter
          ) {
            return false
          }

          if (!query) {
            return true
          }

          return [
            record.item_type,
            record.name,
            record.year_course,
            record.item,
            record.location,
            record.contact,
            record.status,
            record.claim_status,
            record.claimant_name,
            record.claimant_course,
            record.date_claimed,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(query)
            )
        }
      )
    }, [
      records,
      search,
      filter,
    ])

  /*
   * PAGINATION
   */
  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredRecords.length /
          ITEMS_PER_PAGE
      )
    )

  const paginatedRecords =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        ITEMS_PER_PAGE

      return filteredRecords.slice(
        startIndex,
        startIndex +
          ITEMS_PER_PAGE
      )
    }, [
      filteredRecords,
      currentPage,
    ])

  /*
   * If deleting/archiving/searching
   * causes the current page to no
   * longer exist, move back to the
   * last available page.
   */
  useEffect(() => {
    if (
      currentPage > totalPages
    ) {
      setCurrentPage(
        totalPages
      )
    }
  }, [
    currentPage,
    totalPages,
  ])

  const pageNumbers =
    useMemo(() => {
      const pages = []

      for (
        let page = 1;
        page <= totalPages;
        page++
      ) {
        pages.push(page)
      }

      return pages
    }, [totalPages])

  const startRecord =
    filteredRecords.length === 0
      ? 0
      : (currentPage - 1) *
          ITEMS_PER_PAGE +
        1

  const endRecord =
    Math.min(
      currentPage *
        ITEMS_PER_PAGE,
      filteredRecords.length
    )

  const toggleExpanded = (
    id
  ) => {
    setExpanded(
      (previous) => ({
        ...previous,
        [id]:
          !previous[id],
      })
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Lost &amp; Found
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage lost and found items and their claim records.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={
              loadHistory
            }
          >
            <History className="mr-2 h-4 w-4" />
            Archive History
          </Button>

          <Button
            type="button"
            onClick={
              openAddItem
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Lost Item
          </Button>
        </div>
      </div>

      {/* SUCCESS */}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError('')
            }
            className="shrink-0"
            aria-label="Close error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* SEARCH / FILTER */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search lost & found records..."
            className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <select
          value={filter}
          onChange={(event) =>
            setFilter(
              event.target.value
            )
          }
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="All">
            All
          </option>

          <option value="Lost">
            Lost
          </option>

          <option value="Found">
            Found
          </option>
        </select>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border bg-background">
        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Loading records...
          </div>
        ) : filteredRecords.length ===
          0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No Lost &amp; Found records found.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">
                      Type
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                      Item
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                      Name
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                      Date Filed
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                      Location
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                      Status
                    </th>

                    <th className="px-4 py-3 text-right font-medium">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedRecords.map(
                    (record) => {
                      const isExpanded =
                        expanded[
                          record.id
                        ]

                      return (
                        <Fragment
                          key={
                            record.id
                          }
                        >
                          <tr className="border-b last:border-0">
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                  record.item_type ===
                                  'Lost'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-green-100 text-green-700'
                                }`}
                              >
                                {
                                  record.item_type
                                }
                              </span>
                            </td>

                            <td className="px-4 py-3 font-medium">
                              {
                                record.item ||
                                '-'
                              }
                            </td>

                            <td className="px-4 py-3">
                              {
                                record.name ||
                                '-'
                              }
                            </td>

                            <td className="px-4 py-3">
                              {formatDate(
                                record.date_filing
                              )}
                            </td>

                            <td className="px-4 py-3">
                              {
                                record.location ||
                                '-'
                              }
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                  record.status ===
                                  'Claimed'
                                    ? 'bg-blue-100 text-blue-700'
                                    : record.item_type ===
                                        'Lost'
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-green-100 text-green-700'
                                }`}
                              >
                                {
                                  record.status
                                }
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    toggleExpanded(
                                      record.id
                                    )
                                  }
                                  title={
                                    isExpanded
                                      ? 'Hide details'
                                      : 'View details'
                                  }
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    openEditItem(
                                      record
                                    )
                                  }
                                  title="Edit"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    archiveRecord(
                                      record
                                    )
                                  }
                                  title="Archive"
                                >
                                  <Archive className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="border-b bg-muted/20">
                              <td
                                colSpan={7}
                                className="px-4 py-4"
                              >
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                  <Detail
                                    label="Year / Course"
                                    value={
                                      record.year_course
                                    }
                                  />

                                  <Detail
                                    label="Date & Time"
                                    value={formatDateTime(
                                      record.date_time
                                    )}
                                  />

                                  <Detail
                                    label="Contact"
                                    value={
                                      record.contact
                                    }
                                  />

                                  <Detail
                                    label="Claim Status"
                                    value={
                                      record.claim_status
                                    }
                                  />

                                  <Detail
                                    label="Claimant"
                                    value={
                                      record.claimant_name
                                    }
                                  />

                                  <Detail
                                    label="Claimant Course"
                                    value={
                                      record.claimant_course
                                    }
                                  />

                                  <Detail
                                    label="Date Claimed"
                                    value={formatDate(
                                      record.date_claimed
                                    )}
                                  />

                                  <div>
                                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                                      Status
                                    </p>

                                    <select
                                      value={
                                        record.status
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        updateStatus(
                                          record,
                                          event.target.value
                                        )
                                      }
                                      className="h-9 rounded-md border bg-background px-2 text-sm"
                                    >
                                      <option value="Not Found">
                                        Not Found
                                      </option>

                                      <option value="Found">
                                        Found
                                      </option>

                                      <option value="Claimed">
                                        Claimed
                                      </option>
                                    </select>
                                  </div>

                                  <div>
                                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                                      Claim Status
                                    </p>

                                    <select
                                      value={
                                        record.claim_status ||
                                        'Not Claimed'
                                      }
                                      disabled={
                                        record.item_type ===
                                        'Lost'
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        updateClaimStatus(
                                          record,
                                          event.target.value
                                        )
                                      }
                                      className="h-9 rounded-md border bg-background px-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <option value="Not Claimed">
                                        Not Claimed
                                      </option>

                                      <option value="Claimed">
                                        Claimed
                                      </option>
                                    </select>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    }
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Showing{' '}
                <span className="font-medium text-foreground">
                  {startRecord}
                </span>{' '}
                to{' '}
                <span className="font-medium text-foreground">
                  {endRecord}
                </span>{' '}
                of{' '}
                <span className="font-medium text-foreground">
                  {filteredRecords.length}
                </span>{' '}
                records
              </p>

              <div className="flex items-center justify-end gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    currentPage === 1
                  }
                  onClick={() =>
                    setCurrentPage(
                      (previous) =>
                        Math.max(
                          1,
                          previous - 1
                        )
                    )
                  }
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {pageNumbers.map(
                    (page) => (
                      <Button
                        key={page}
                        type="button"
                        variant={
                          currentPage ===
                          page
                            ? 'default'
                            : 'outline'
                        }
                        size="sm"
                        className="h-9 min-w-9 px-3"
                        onClick={() =>
                          setCurrentPage(
                            page
                          )
                        }
                      >
                        {page}
                      </Button>
                    )
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  onClick={() =>
                    setCurrentPage(
                      (previous) =>
                        Math.min(
                          totalPages,
                          previous + 1
                        )
                    )
                  }
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {showItem && (
        <Modal
          title={
            isEditing
              ? `Edit ${itemType} Item`
              : 'Add Lost / Found Item'
          }
          close={
            closeItemModal
          }
          onSave={saveItem}
          isEditing={isEditing}
          saving={saving}
        >
          {/* ITEM TYPE */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Item Type
            </label>

            <select
              value={itemType}
              disabled={saving}
              onChange={(event) =>
                changeItemType(
                  event.target.value
                )
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="Lost">
                Lost
              </option>

              <option value="Found">
                Found
              </option>
            </select>
          </div>

          {/* DATE FILING */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Date Filing *
            </label>

            <input
              type="date"
              value={
                itemForm.date_filing
              }
              disabled={saving}
              onChange={(event) =>
                updateForm(
                  'date_filing',
                  event.target.value
                )
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>

          {/* NAME */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Name
            </label>

            <input
              type="text"
              value={
                itemForm.name
              }
              disabled={saving}
              onChange={(event) =>
                updateForm(
                  'name',
                  event.target.value
                )
              }
              placeholder="Student name"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>

          {/* YEAR / COURSE */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Year / Course
            </label>

            <input
              type="text"
              value={
                itemForm.year_course
              }
              disabled={saving}
              onChange={(event) =>
                updateForm(
                  'year_course',
                  event.target.value
                )
              }
              placeholder="e.g. BSIT 4"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>

          {/* ITEM */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Item *
            </label>

            <input
              type="text"
              value={
                itemForm.item
              }
              disabled={saving}
              onChange={(event) =>
                updateForm(
                  'item',
                  event.target.value
                )
              }
              placeholder="Item name"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>

          {/* DATE & TIME */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Date &amp; Time
            </label>

            <input
              type="datetime-local"
              value={
                itemForm.date_time
              }
              disabled={saving}
              onChange={(event) =>
                updateForm(
                  'date_time',
                  event.target.value
                )
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>

          {/* LOCATION */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Location *
            </label>

            <input
              type="text"
              value={
                itemForm.location
              }
              disabled={saving}
              onChange={(event) =>
                updateForm(
                  'location',
                  event.target.value
                )
              }
              placeholder={
                itemType ===
                'Lost'
                  ? 'Where was it lost?'
                  : 'Where was it found?'
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>

          {/* CONTACT */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Contact
            </label>

            <input
              type="text"
              value={
                itemForm.contact
              }
              disabled={saving}
              onChange={(event) =>
                updateForm(
                  'contact',
                  event.target.value
                )
              }
              placeholder="Contact information"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>

          {/* CLAIM STATUS */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Claim Status
            </label>

            <select
              value={
                itemForm.claim_status
              }
              disabled={
                saving ||
                itemType ===
                  'Lost'
              }
              onChange={(event) =>
                updateForm(
                  'claim_status',
                  event.target.value
                )
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="Not Claimed">
                Not Claimed
              </option>

              <option value="Claimed">
                Claimed
              </option>
            </select>
          </div>

          {/* CLAIMANT */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Claimant
            </label>

            <input
              type="text"
              value={
                itemForm.claimant_name
              }
              disabled={saving}
              onChange={(event) =>
                updateForm(
                  'claimant_name',
                  event.target.value
                )
              }
              placeholder="Claimant name"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>

          {/* CLAIMANT COURSE */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Claimant Course
            </label>

            <input
              type="text"
              value={
                itemForm.claimant_course
              }
              disabled={saving}
              onChange={(event) =>
                updateForm(
                  'claimant_course',
                  event.target.value
                )
              }
              placeholder="e.g. BSIT 4"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>

          {/* DATE CLAIMED */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Date Claimed
            </label>

            <input
              type="date"
              value={
                itemForm.date_claimed
              }
              disabled={saving}
              onChange={(event) =>
                updateForm(
                  'date_claimed',
                  event.target.value
                )
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>
        </Modal>
      )}

      {/* ARCHIVE HISTORY MODAL */}
      {showHistory && (
        <HistoryModal
          records={
            historyRecords
          }
          loading={
            historyLoading
          }
          close={() =>
            setShowHistory(
              false
            )
          }
          restoreRecord={
            restoreRecord
          }
        />
      )}
    </div>
  )
}

function Detail({
  label,
  value,
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">
        {label}
      </p>

      <p className="text-sm">
        {value || '-'}
      </p>
    </div>
  )
}

function Modal({
  title,
  children,
  close,
  onSave,
  isEditing,
  saving,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-background shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">
            {title}
          </h2>

          <button
            type="button"
            disabled={saving}
            onClick={close}
            className="rounded-md p-1 hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {children}
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={close}
            >
              Cancel
            </Button>

            <Button
              type="button"
              disabled={saving}
              onClick={onSave}
            >
              {saving ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function HistoryModal({
  records,
  loading,
  close,
  restoreRecord,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-background shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">
              Archive History
            </h2>

            <p className="text-sm text-muted-foreground">
              Previously archived Lost &amp; Found records.
            </p>
          </div>

          <button
            type="button"
            onClick={close}
            className="rounded-md p-1 hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading archive history...
            </div>
          ) : records.length ===
            0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No archived records.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      Type
                    </th>

                    <th className="px-4 py-3 text-left">
                      Item
                    </th>

                    <th className="px-4 py-3 text-left">
                      Name
                    </th>

                    <th className="px-4 py-3 text-left">
                      Date Filed
                    </th>

                    <th className="px-4 py-3 text-left">
                      Archived
                    </th>

                    <th className="px-4 py-3 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {records.map(
                    (record) => (
                      <tr
                        key={
                          record.id
                        }
                        className="border-b last:border-0"
                      >
                        <td className="px-4 py-3">
                          {
                            record.item_type
                          }
                        </td>

                        <td className="px-4 py-3 font-medium">
                          {
                            record.item
                          }
                        </td>

                        <td className="px-4 py-3">
                          {
                            record.name ||
                            '-'
                          }
                        </td>

                        <td className="px-4 py-3">
                          {formatDate(
                            record.date_filing
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {formatDateTime(
                            record.archived_at
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              restoreRecord(
                                record
                              )
                            }
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Restore
                          </Button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={close}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}