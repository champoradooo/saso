import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { api } from "../api/client";

import StudentSearch from "@/components/StudentSearch";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Search,
  Plus,
  Eye,
  X,
  Pencil,
  ShieldAlert,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* =========================================================
   CONSTANTS
========================================================= */

const SEV = {
  minor: "Minor Offense",
  major: "Major Offense",
  grave: "Grave Offense",
};

const STA = {
  pending: "Pending",
  under_review: "Under Review",
  resolved: "Resolved",
};

/* =========================================================
   VIOLATION GROUPS
========================================================= */

const VIOLATION_GROUPS = {
  minor: [
    "Tardiness",
    "Entering school without ID",
    "Improper wearing of school uniform",
    "Improper wearing of ID",
    "Improper attire",
    "Failure to wear prescribed uniform",
    "Unauthorized use of gadgets during class",
    "Using mobile phones during class",
    "Eating inside prohibited areas",
    "Littering",
    "Making unnecessary noise",
    "Loitering",
    "Failure to observe cleanliness",
    "Failure to observe school rules",
  ],

  major: [
    "Disrespectful behavior",
    "Disrespect toward faculty or staff",
    "Disrespect toward school personnel",
    "Bullying",
    "Unauthorized absence",
    "Cutting classes",
    "Leaving school premises without permission",
    "Academic dishonesty",
    "Forgery of documents",
    "Unauthorized solicitation",
    "Unauthorized selling",
    "Unauthorized organization activity",
    "Possession of prohibited materials",
    "Smoking",
    "Vaping",
    "Gambling",
    "Fighting",
  ],

  grave: [
    "Physical assault",
    "Serious physical injury",
    "Sexual harassment",
    "Sexual assault",
    "Possession of dangerous drugs",
    "Use of dangerous drugs",
    "Distribution of dangerous drugs",
    "Possession of weapons",
    "Threatening another person",
    "Serious theft",
    "Robbery",
    "Extortion",
    "Serious vandalism",
    "Fraud",
    "Cheating",
    "Acts punishable under Philippine laws",
  ],
};

/* =========================================================
   SHORT VIOLATION LABELS
========================================================= */

const VIOLATION_SHORT_LABELS = {
  "Entering school without ID": "Entering without ID",
  "Improper wearing of school uniform": "Improper uniform",
  "Improper wearing of ID": "Improper ID",
  "Failure to wear prescribed uniform": "No prescribed uniform",
  "Unauthorized use of gadgets during class":
    "Unauthorized gadgets",
  "Using mobile phones during class": "Mobile phone use",
  "Eating inside prohibited areas": "Eating in prohibited area",
  "Failure to observe cleanliness": "Cleanliness violation",
  "Failure to observe school rules": "Failure to follow rules",

  "Disrespectful behavior": "Disrespectful behavior",
  "Disrespect toward faculty or staff":
    "Disrespect toward faculty/staff",
  "Disrespect toward school personnel":
    "Disrespect toward personnel",

  "Unauthorized absence": "Unauthorized absence",
  "Cutting classes": "Cutting classes",
  "Leaving school premises without permission":
    "Leaving without permission",

  "Academic dishonesty": "Academic dishonesty",
  "Forgery of documents": "Document forgery",
  "Unauthorized solicitation": "Unauthorized solicitation",
  "Unauthorized selling": "Unauthorized selling",
  "Unauthorized organization activity":
    "Unauthorized org activity",
  "Possession of prohibited materials":
    "Prohibited materials",

  "Physical assault": "Physical assault",
  "Serious physical injury": "Serious physical injury",
  "Sexual harassment": "Sexual harassment",
  "Sexual assault": "Sexual assault",
  "Possession of dangerous drugs": "Drug possession",
  "Use of dangerous drugs": "Drug use",
  "Distribution of dangerous drugs":
    "Drug distribution",
  "Possession of weapons": "Weapon possession",
  "Threatening another person": "Threatening behavior",
  "Serious theft": "Serious theft",
  "Acts punishable under Philippine laws":
    "Violation of law",
};

function getViolationLabel(violation) {
  return (
    VIOLATION_SHORT_LABELS[violation] ||
    violation ||
    "—"
  );
}

function getViolationSeverity(violation) {
  const value = String(violation || "").trim();

  if (VIOLATION_GROUPS.grave.includes(value)) {
    return "grave";
  }

  if (VIOLATION_GROUPS.major.includes(value)) {
    return "major";
  }

  return "minor";
}

/* =========================================================
   VIOLATION SELECT (alphabetical + searchable)
========================================================= */

function ViolationSelect({ value, onChange }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const groupedOptions = useMemo(() => {
    const q = query.trim().toLowerCase();

    return Object.entries(VIOLATION_GROUPS)
      .map(([severity, violations]) => {
        const items = [...violations]
          .map((violation) => ({
            value: violation,
            label: getViolationLabel(violation),
          }))
          .sort((a, b) =>
            a.label.localeCompare(b.label, undefined, {
              sensitivity: "base",
            })
          )
          .filter((item) => {
            if (!q) return true;

            return (
              item.label.toLowerCase().includes(q) ||
              item.value.toLowerCase().includes(q)
            );
          });

        return { severity, items };
      })
      .filter((group) => group.items.length > 0);
  }, [query]);

  const selectedLabel = value
    ? getViolationLabel(value)
    : "";

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target)
      ) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative mt-1.5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

        <Input
          placeholder="Search violation..."
          value={open ? query : selectedLabel}
          onClick={() => {
            setQuery("");
            setOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          className="pl-8"
        />
      </div>

      {open && (
        <div className="absolute z-[9999] mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-background shadow-lg">
          {groupedOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No violations found.
            </div>
          ) : (
            groupedOptions.map(({ severity, items }) => (
              <div key={severity}>
                <div className="sticky top-0 bg-muted/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground backdrop-blur">
                  {SEV[severity]}
                </div>

                {items.map((item) => (
                  <button
                    type="button"
                    key={item.value}
                    onClick={() => {
                      onChange(item.value);
                      setQuery("");
                      setOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm transition hover:bg-muted ${
                      value === item.value
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : ""
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SANCTIONS
========================================================= */

const SANCTIONS = [
  { value: "verbal_warning", label: "Verbal Warning" },
  { value: "written_warning", label: "Written Warning" },
  {
    value: "written_warning_probation",
    label: "Written Warning + Probation",
  },
  { value: "community_service", label: "Community Service" },
  { value: "suspension", label: "Suspension" },
  {
    value: "suspension_with_probation",
    label: "Suspension with Probation",
  },
  { value: "final_warning", label: "Final Warning" },
  { value: "dismissal", label: "Dismissal" },
  { value: "expulsion", label: "Expulsion" },
];

/* =========================================================
   HELPERS
========================================================= */

function fmt(date) {
  if (!date) return "—";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return date;
  }

  return d.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/*
 * NEWEST FIRST / LAST IN, FIRST OUT
 *
 * Priority:
 * 1. created_at
 * 2. incident_date
 * 3. id
 *
 * This makes the most recently added record appear first,
 * even when multiple records have the same incident date.
 */
function sortNewestFirst(list) {
  return [...list].sort((a, b) => {
    const createdA = a.created_at
      ? new Date(a.created_at).getTime()
      : 0;

    const createdB = b.created_at
      ? new Date(b.created_at).getTime()
      : 0;

    if (createdB !== createdA) {
      return createdB - createdA;
    }

    const dateA = a.incident_date
      ? new Date(a.incident_date).getTime()
      : 0;

    const dateB = b.incident_date
      ? new Date(b.incident_date).getTime()
      : 0;

    if (dateB !== dateA) {
      return dateB - dateA;
    }

    return Number(b.id || 0) - Number(a.id || 0);
  });
}

/*
 * OLDEST FIRST
 *
 * Used only for calculating offense numbers.
 *
 * Example:
 * First record  = #1
 * Second record = #2
 * Latest record = #3
 *
 * The table itself still displays #3 first.
 */
function sortOldestFirst(list) {
  return [...list].sort((a, b) => {
    const createdA = a.created_at
      ? new Date(a.created_at).getTime()
      : Number.MAX_SAFE_INTEGER;

    const createdB = b.created_at
      ? new Date(b.created_at).getTime()
      : Number.MAX_SAFE_INTEGER;

    if (createdA !== createdB) {
      return createdA - createdB;
    }

    const dateA = a.incident_date
      ? new Date(a.incident_date).getTime()
      : Number.MAX_SAFE_INTEGER;

    const dateB = b.incident_date
      ? new Date(b.incident_date).getTime()
      : Number.MAX_SAFE_INTEGER;

    if (dateA !== dateB) {
      return dateA - dateB;
    }

    return Number(a.id || 0) - Number(b.id || 0);
  });
}

function normalizeStudent(student) {
  if (
    student === null ||
    student === undefined ||
    student === ""
  ) {
    return "";
  }

  return String(student);
}

function normalizeViolation(violation) {
  return String(violation || "")
    .trim()
    .toLowerCase();
}

function getOffenseKey(record) {
  const student = normalizeStudent(record.student);
  const violation = normalizeViolation(record.violation);

  if (!student || !violation) {
    return "";
  }

  return `${student}::${violation}`;
}

function buildOffenseNumbers(records) {
  const sorted = sortOldestFirst(records);

  const counters = {};
  const numbers = {};

  for (const record of sorted) {
    const key = getOffenseKey(record);

    if (!key) {
      numbers[record.id] =
        record.offense_number || 1;

      continue;
    }

    counters[key] = (counters[key] || 0) + 1;

    numbers[record.id] = counters[key];
  }

  return numbers;
}

function getMediaUrl(fileUrl) {
  if (!fileUrl) return "";

  if (
    fileUrl.startsWith("http://") ||
    fileUrl.startsWith("https://")
  ) {
    return fileUrl;
  }

  return `http://127.0.0.1:8000${fileUrl}`;
}

/* =========================================================
   BADGES
========================================================= */

function SeverityBadge({ value }) {
  const severity = value || "minor";

  const classes = {
    minor:
      "border-yellow-200 bg-yellow-50 text-yellow-700",
    major:
      "border-orange-200 bg-orange-50 text-orange-700",
    grave:
      "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex min-w-[96px] items-center justify-center rounded-full border px-3 py-1.5 text-xs font-medium leading-tight ${
        classes[severity] || classes.minor
      }`}
    >
      {SEV[severity] || severity}
    </span>
  );
}

function StatusBadge({ value }) {
  const status = value || "pending";

  const classes = {
    pending:
      "border-yellow-200 bg-yellow-50 text-yellow-700",
    under_review:
      "border-blue-200 bg-blue-50 text-blue-700",
    resolved:
      "border-green-200 bg-green-50 text-green-700",
  };

  return (
    <span
      className={`inline-flex min-w-[76px] items-center justify-center rounded-full border px-3 py-1.5 text-xs font-medium leading-tight ${
        classes[status] || classes.pending
      }`}
    >
      {STA[status] || status}
    </span>
  );
}

/* =========================================================
   EDIT CASE MODAL
========================================================= */

function EditCaseModal({
  caseData,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState({
    violation: caseData.violation || "",
    severity:
      caseData.severity ||
      getViolationSeverity(caseData.violation),
    status: caseData.status || "pending",
    sanction: caseData.sanction || "",
    description: caseData.description || "",
  });

  const [studentNarrative, setStudentNarrative] =
    useState(null);

  const [reporterNarrative, setReporterNarrative] =
    useState(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleViolationChange = (value) => {
    update("violation", value);

    update(
      "severity",
      getViolationSeverity(value)
    );
  };

  const submit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      const data = new FormData();

      data.append("violation", form.violation);
      data.append("severity", form.severity);
      data.append("status", form.status);
      data.append(
        "sanction",
        form.status === "under_review"
          ? ""
          : form.sanction
      );
      data.append("description", form.description);

      if (studentNarrative) {
        data.append(
          "student_narrative",
          studentNarrative
        );
      }

      if (reporterNarrative) {
        data.append(
          "reporter_narrative",
          reporterNarrative
        );
      }

      await api.patch(
        `/discipline/cases/${caseData.id}/`,
        data
      );

      await onSaved();
      onClose();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to update the case."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-3xl overflow-y-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle>
            Edit Discipline Case
          </DialogTitle>

          <DialogDescription>
            Update the details of this discipline record.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={submit}
          className="space-y-5"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">
                Case #
              </label>

              <Input
                value={caseData.case_number || ""}
                disabled
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Student
              </label>

              <Input
                value={
                  caseData.student_name ||
                  caseData.student_id_display ||
                  ""
                }
                disabled
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">
              Violation
            </label>

            <ViolationSelect
              value={form.violation}
              onChange={handleViolationChange}
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Severity
            </label>

            <Input
              value={
                SEV[form.severity] ||
                form.severity ||
                ""
              }
              disabled
              className="mt-1.5"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Status
            </label>

            <Select
              value={form.status}
              onValueChange={(value) => {
                update("status", value);

                if (value === "under_review") {
                  update("sanction", "");
                }
              }}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="pending">
                  Pending
                </SelectItem>

                <SelectItem value="under_review">
                  Under Review
                </SelectItem>

                <SelectItem value="resolved">
                  Resolved
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">
              Sanction
            </label>

            {form.status === "under_review" ? (
              <Input
                value="Under Review"
                disabled
                className="mt-1.5"
              />
            ) : (
              <Select
                value={form.sanction || ""}
                onValueChange={(value) =>
                  update("sanction", value)
                }
              >
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue placeholder="Select sanction" />
                </SelectTrigger>

                <SelectContent
                  position="popper"
                  sideOffset={4}
                  className="z-[9999] max-h-[320px] w-[var(--radix-select-trigger-width)] min-w-[280px] max-w-[calc(100vw-2rem)] overflow-y-auto overflow-x-hidden rounded-lg border bg-background p-1 shadow-lg"
                >
                  {SANCTIONS.map((sanction) => (
                    <SelectItem
                      key={sanction.value}
                      value={sanction.value}
                    >
                      {sanction.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">
              Description
            </label>

            <textarea
              value={form.description}
              onChange={(e) =>
                update(
                  "description",
                  e.target.value
                )
              }
              className="mt-1.5 min-h-[120px] w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter case description..."
            />
          </div>

          {caseData.student_narrative && (
            <div>
              <label className="text-sm font-medium">
                Current Student Narrative
              </label>

              <a
                href={getMediaUrl(
                  caseData.student_narrative
                )}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 block text-sm text-blue-600 hover:underline"
              >
                View current file
              </a>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">
              Replace Student Narrative
            </label>

            <Input
              type="file"
              className="mt-1.5"
              onChange={(e) =>
                setStudentNarrative(
                  e.target.files?.[0] || null
                )
              }
            />
          </div>

          {caseData.reporter_narrative && (
            <div>
              <label className="text-sm font-medium">
                Current Reporter Narrative
              </label>

              <a
                href={getMediaUrl(
                  caseData.reporter_narrative
                )}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 block text-sm text-blue-600 hover:underline"
              >
                View current file
              </a>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">
              Replace Reporter Narrative
            </label>

            <Input
              type="file"
              className="mt-1.5"
              onChange={(e) =>
                setReporterNarrative(
                  e.target.files?.[0] || null
                )
              }
            />
          </div>

          {error && (
            <div className="whitespace-pre-line rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2">
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
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* =========================================================
   ADD CASE MODAL
========================================================= */

function AddCaseModal({ onClose, onSaved }) {
  const [students, setStudents] = useState([]);

  const [form, setForm] = useState({
    reason: "",
    student: "",
    incident_date: "",
    violation: "",
    description: "",
    severity: "minor",
    status: "under_review",
    sanction: "",
  });

  const [studentNarrative, setStudentNarrative] =
    useState(null);

  const [reporterNarrative, setReporterNarrative] =
    useState(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const response = await api.get("/students/");

        const records = Array.isArray(response)
          ? response
          : response?.results || [];

        setStudents(records);
      } catch (err) {
        console.error(
          "Unable to load students:",
          err
        );
      }
    };

    loadStudents();
  }, []);

  const update = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleViolationChange = (value) => {
    update("violation", value);

    update(
      "severity",
      getViolationSeverity(value)
    );
  };

  const submit = async (e) => {
    e.preventDefault();

    setError("");

    if (!form.student) {
      setError("Please select a student.");
      return;
    }

    if (!form.incident_date) {
      setError("Incident date is required.");
      return;
    }

    if (!form.violation) {
      setError("Violation is required.");
      return;
    }

    if (!form.description.trim()) {
      setError("Description is required.");
      return;
    }

    if (!form.severity) {
      setError("Severity is required.");
      return;
    }

    setSaving(true);

    try {
      const data = new FormData();

      data.append(
        "reason",
        form.reason.trim()
      );

      data.append("student", form.student);

      data.append(
        "incident_date",
        form.incident_date
      );

      data.append("violation", form.violation);

      data.append(
        "description",
        form.description.trim()
      );

      data.append("severity", form.severity);
      data.append("status", form.status);
      data.append(
        "sanction",
        form.status === "under_review"
          ? ""
          : form.sanction
      );

      if (studentNarrative) {
        data.append(
          "student_narrative",
          studentNarrative
        );
      }

      if (reporterNarrative) {
        data.append(
          "reporter_narrative",
          reporterNarrative
        );
      }

      await api.post(
        "/discipline/cases/",
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      await onSaved();
      onClose();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to record the case."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-3xl overflow-y-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle>
            Record Discipline Case
          </DialogTitle>

          <DialogDescription>
            Add a new student discipline record.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={submit}
          className="space-y-5"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">
                Case #
              </label>

              <Input
                value="Auto-generated"
                disabled
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Incident Date
              </label>

              <Input
                type="date"
                value={form.incident_date}
                onChange={(e) =>
                  update(
                    "incident_date",
                    e.target.value
                  )
                }
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">
              Student
            </label>

            <div className="mt-1.5">
              <StudentSearch
                students={students}
                value={form.student}
                onChange={(value) =>
                  update("student", value)
                }
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">
              Violation
            </label>

            <ViolationSelect
              value={form.violation}
              onChange={handleViolationChange}
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Severity
            </label>

            <Input
              value={
                SEV[form.severity] ||
                form.severity
              }
              disabled
              className="mt-1.5"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Status
            </label>

            <Select
              value={form.status}
              onValueChange={(value) => {
                update("status", value);

                if (value === "under_review") {
                  update("sanction", "");
                }
              }}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="under_review">
                  Under Review
                </SelectItem>

                <SelectItem value="resolved">
                  Resolved
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">
              Sanction
            </label>

            {form.status === "under_review" ? (
              <Input
                value="Under Review"
                disabled
                className="mt-1.5"
              />
            ) : (
              <Select
                value={form.sanction || ""}
                onValueChange={(value) =>
                  update("sanction", value)
                }
              >
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue placeholder="Select sanction" />
                </SelectTrigger>

                <SelectContent
                  position="popper"
                  sideOffset={4}
                  className="z-[9999] max-h-[320px] w-[var(--radix-select-trigger-width)] min-w-[280px] max-w-[calc(100vw-2rem)] overflow-y-auto overflow-x-hidden rounded-lg border bg-background p-1 shadow-lg"
                >
                  {SANCTIONS.map((sanction) => (
                    <SelectItem
                      key={sanction.value}
                      value={sanction.value}
                    >
                      {sanction.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">
              Description
            </label>

            <textarea
              value={form.description}
              onChange={(e) =>
                update(
                  "description",
                  e.target.value
                )
              }
              className="mt-1.5 min-h-[120px] w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="Describe the incident..."
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Student Narrative
            </label>

            <Input
              type="file"
              className="mt-1.5"
              onChange={(e) =>
                setStudentNarrative(
                  e.target.files?.[0] || null
                )
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Reporter Narrative
            </label>

            <Input
              type="file"
              className="mt-1.5"
              onChange={(e) =>
                setReporterNarrative(
                  e.target.files?.[0] || null
                )
              }
            />
          </div>

          {error && (
            <div className="whitespace-pre-line rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2">
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
              {saving ? "Recording..." : "Record Case"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* =========================================================
   DISCIPLINE PAGE
========================================================= */

export default function Discipline() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [severityFilter, setSeverityFilter] =
    useState("all");

  const [violationFilter, setViolationFilter] =
    useState("all");

  const [activeTab, setActiveTab] = useState(() => {
    return (
      localStorage.getItem(
        "discipline_active_tab"
      ) || "all"
    );
  });

  const [editingCase, setEditingCase] =
    useState(null);

  const [historyCase, setHistoryCase] =
    useState(null);

  const [showAdd, setShowAdd] =
    useState(false);

  const [currentPage, setCurrentPage] =
    useState(1);

  const RECORDS_PER_PAGE = 10;

  /* =======================================================
     LOAD ALL CASES
  ======================================================= */

  const fetchAllCases = async () => {
    let url = "/discipline/cases/";

    const allRecords = [];
    const seenIds = new Set();

    while (url) {
      const response = await api.get(url);

      const records = Array.isArray(response)
        ? response
        : response?.results || [];

      records.forEach((record) => {
        if (!record?.id) return;

        if (!seenIds.has(record.id)) {
          seenIds.add(record.id);
          allRecords.push(record);
        }
      });

      if (
        !Array.isArray(response) &&
        response?.next
      ) {
        url = response.next;
      } else {
        url = null;
      }
    }

    return allRecords;
  };

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const records = await fetchAllCases();

      /*
       * ALWAYS SORT NEWEST FIRST AFTER FETCHING.
       *
       * This is important because the backend may return
       * records in a different order.
       */
      setCases(sortNewestFirst(records));
    } catch (err) {
      console.error(
        "Failed to load discipline cases:",
        err
      );

      setCases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* =======================================================
     SAVE TAB
  ======================================================= */

  useEffect(() => {
    localStorage.setItem(
      "discipline_active_tab",
      activeTab
    );
  }, [activeTab]);

  /* =======================================================
     OFFENSE NUMBERS
  ======================================================= */

  const offenseNumbers = useMemo(() => {
    return buildOffenseNumbers(cases);
  }, [cases]);

  /* =======================================================
     VIOLATION OPTIONS
  ======================================================= */

  const offenseOptions = useMemo(() => {
    return Object.entries(VIOLATION_GROUPS).flatMap(
      ([severity, violations]) =>
        violations.map((violation) => ({
          value: violation,
          label: getViolationLabel(violation),
          severity,
        }))
    );
  }, []);

  /* =======================================================
     COUNTS
  ======================================================= */

  const counts = useMemo(() => {
    return {
      all: cases.length,

      pending: cases.filter(
        (c) => c.status === "pending"
      ).length,

      under_review: cases.filter(
        (c) => c.status === "under_review"
      ).length,

      resolved: cases.filter(
        (c) => c.status === "resolved"
      ).length,
    };
  }, [cases]);

  /* =======================================================
     FILTER + SEARCH
  ======================================================= */

  const filtered = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    /*
     * Keep the filtered result NEWEST FIRST as well.
     * This protects the LIFO order even after filtering.
     */
    const result = cases.filter((c) => {
      const matchesTab =
        activeTab === "all" ||
        c.status === activeTab;

      const matchesSeverity =
        severityFilter === "all" ||
        c.severity === severityFilter;

      const matchesViolation =
        violationFilter === "all" ||
        c.violation === violationFilter;

      const searchableText = [
        c.case_number,
        c.student_name,
        c.student_id_display,
        c.violation,
        c.reason,
        c.description,
      ]
        .filter(
          (value) =>
            value !== null &&
            value !== undefined
        )
        .map((value) =>
          String(value).toLowerCase()
        );

      const matchesSearch =
        !searchText ||
        searchableText.some((value) =>
          value.includes(searchText)
        );

      return (
        matchesTab &&
        matchesSeverity &&
        matchesViolation &&
        matchesSearch
      );
    });

    return sortNewestFirst(result);
  }, [
    cases,
    search,
    activeTab,
    severityFilter,
    violationFilter,
  ]);

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filtered.length / RECORDS_PER_PAGE
    )
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    activeTab,
    severityFilter,
    violationFilter,
  ]);

  const pageStart =
    (currentPage - 1) * RECORDS_PER_PAGE;

  const pageEnd =
    pageStart + RECORDS_PER_PAGE;

  const visibleCases = filtered.slice(
    pageStart,
    pageEnd
  );

  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= 5) {
      for (
        let i = 1;
        i <= totalPages;
        i++
      ) {
        pages.push(i);
      }

      return pages;
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push("...");
    }

    const start = Math.max(
      2,
      currentPage - 1
    );

    const end = Math.min(
      totalPages - 1,
      currentPage + 1
    );

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("...");
    }

    pages.push(totalPages);

    return pages;
  };

  /* =======================================================
     HISTORY
  ======================================================= */

  const historyRecords = useMemo(() => {
    if (!historyCase) {
      return [];
    }

    const studentId = normalizeStudent(
      historyCase.student
    );

    const records = cases.filter((record) => {
      return (
        normalizeStudent(record.student) ===
        studentId
      );
    });

    /*
     * HISTORY IS ALSO NEWEST FIRST.
     *
     * Shows all offenses for this student.
     */
    return sortNewestFirst(records);
  }, [cases, historyCase]);

  const historyStudentName =
    historyCase?.student_name ||
    historyCase?.student_id_display ||
    "Student";

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="w-full px-6 pb-6 pt-6">
      <div className="w-full space-y-5">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-[26px] font-bold leading-tight tracking-tight text-foreground">
              Discipline
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage and monitor student discipline
              records.
            </p>
          </div>

          <Button
            onClick={() => setShowAdd(true)}
            className="h-9 shrink-0 rounded-lg px-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Case
          </Button>
        </div>

        {/* =================================================
            STATUS CARDS
        ================================================= */}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

          {/* ALL */}
          <Card
            className={`h-[124px] cursor-pointer rounded-2xl border transition ${
              activeTab === "all"
                ? "border-2 border-primary"
                : "border-border"
            }`}
            onClick={() => setActiveTab("all")}
          >
            <CardContent className="flex h-full items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  All Cases
                </p>

                <p className="mt-1 text-[27px] font-bold leading-none">
                  {counts.all}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50">
                <ShieldAlert className="h-5 w-5 text-slate-500" />
              </div>
            </CardContent>
          </Card>

          {/* PENDING */}
          <Card
            className={`h-[124px] cursor-pointer rounded-2xl border transition ${
              activeTab === "pending"
                ? "border-2 border-primary"
                : "border-border"
            }`}
            onClick={() =>
              setActiveTab("pending")
            }
          >
            <CardContent className="flex h-full items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Pending
                </p>

                <p className="mt-1 text-[27px] font-bold leading-none">
                  {counts.pending}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-50">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          {/* UNDER REVIEW */}
          <Card
            className={`h-[124px] cursor-pointer rounded-2xl border transition ${
              activeTab === "under_review"
                ? "border-2 border-primary"
                : "border-border"
            }`}
            onClick={() =>
              setActiveTab("under_review")
            }
          >
            <CardContent className="flex h-full items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Under Review
                </p>

                <p className="mt-1 text-[27px] font-bold leading-none">
                  {counts.under_review}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          {/* RESOLVED */}
          <Card
            className={`h-[124px] cursor-pointer rounded-2xl border transition ${
              activeTab === "resolved"
                ? "border-2 border-primary"
                : "border-border"
            }`}
            onClick={() =>
              setActiveTab("resolved")
            }
          >
            <CardContent className="flex h-full items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Resolved
                </p>

                <p className="mt-1 text-[27px] font-bold leading-none">
                  {counts.resolved}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* =================================================
            RECORDS CARD
        ================================================= */}

        <Card className="overflow-hidden rounded-2xl border border-border">
          <CardHeader className="px-4 pb-3 pt-4 sm:px-5">
            <div className="space-y-3">

              <CardTitle className="text-base font-semibold">
                Discipline Records
              </CardTitle>

              {/* SEARCH + FILTERS */}

              <div className="flex flex-col gap-2.5 xl:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search case, student, violation..."
                    className="h-9 rounded-lg pl-9 text-sm"
                  />
                </div>

                <Select
                  value={severityFilter}
                  onValueChange={setSeverityFilter}
                >
                  <SelectTrigger className="h-9 w-full rounded-lg xl:w-[180px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">
                      All Severity
                    </SelectItem>

                    <SelectItem value="minor">
                      Minor Offense
                    </SelectItem>

                    <SelectItem value="major">
                      Major Offense
                    </SelectItem>

                    <SelectItem value="grave">
                      Grave Offense
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={violationFilter}
                  onValueChange={setViolationFilter}
                >
                  <SelectTrigger className="h-9 w-full rounded-lg xl:w-[210px]">
                    <SelectValue placeholder="Violation" />
                  </SelectTrigger>

                  <SelectContent
                    position="popper"
                    sideOffset={4}
                    className="z-[9999] max-h-[360px] w-[var(--radix-select-trigger-width)] min-w-[280px] max-w-[calc(100vw-2rem)] overflow-y-auto overflow-x-hidden rounded-lg border bg-background p-1 shadow-lg"
                  >
                    <SelectItem value="all">
                      All Violations
                    </SelectItem>

                    {Object.entries(VIOLATION_GROUPS).map(
                      ([severity, violations]) => (
                        <div key={severity}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            {SEV[severity]}
                          </div>

                          {violations.map((violation) => (
                            <SelectItem
                              key={violation}
                              value={violation}
                            >
                              {getViolationLabel(violation)}
                            </SelectItem>
                          ))}
                        </div>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* STATUS TABS */}

              <div className="flex w-fit max-w-full items-center gap-1.5 overflow-x-auto rounded-full bg-muted/60 p-1">
                {[
                  ["all", "All"],
                  ["pending", "Pending"],
                  [
                    "under_review",
                    "Under Review",
                  ],
                  ["resolved", "Resolved"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setActiveTab(value)
                    }
                    className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition ${
                      activeTab === value
                        ? "bg-white text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{label}</span>

                    <span className="text-[11px] text-muted-foreground">
                      {counts[value]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">

            {/* =================================================
                TABLE
            ================================================= */}

            <div className="w-full overflow-x-auto border-t">
              <table className="w-full min-w-[1050px] table-fixed text-sm">
                <colgroup>
                  <col className="w-[13%]" />
                  <col className="w-[14%]" />
                  <col className="w-[22%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[9%]" />
                  <col className="w-[11%]" />
                  <col className="w-[7%]" />
                </colgroup>

                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Case #
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Student
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Violation
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Severity
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Status
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                      Offenses
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Date
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-12 text-center text-sm text-muted-foreground"
                      >
                        Loading discipline records...
                      </td>
                    </tr>
                  ) : visibleCases.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-12 text-center"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <ShieldAlert className="h-8 w-8 text-muted-foreground" />

                          <p className="font-medium">
                            No discipline records found
                          </p>

                          <p className="text-sm text-muted-foreground">
                            Try changing your search
                            or filters.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    visibleCases.map((c) => {
                      const offenseNumber =
                        offenseNumbers[c.id] ||
                        c.offense_number ||
                        1;

                      return (
                        <tr
                          key={c.id}
                          className="border-b last:border-b-0 transition-colors hover:bg-muted/20"
                        >

                          {/* CASE */}

                          <td className="px-4 py-3.5 align-middle font-medium">
                            <div className="truncate">
                              {c.case_number || "—"}
                            </div>
                          </td>

                          {/* STUDENT */}

                          <td className="px-4 py-3.5 align-middle">
                            <div className="leading-tight">
                              <div className="font-medium">
                                {c.student_name ||
                                  "Unknown Student"}
                              </div>

                              {c.student_id_display && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {
                                    c.student_id_display
                                  }
                                </div>
                              )}
                            </div>
                          </td>

                          {/* VIOLATION */}

                          <td className="px-4 py-3.5 align-middle">
                            <div
                              className="truncate"
                              title={
                                c.violation || ""
                              }
                            >
                              {getViolationLabel(
                                c.violation
                              )}
                            </div>
                          </td>

                          {/* SEVERITY */}

                          <td className="px-4 py-3.5 align-middle">
                            <SeverityBadge
                              value={
                                c.severity ||
                                getViolationSeverity(
                                  c.violation
                                )
                              }
                            />
                          </td>

                          {/* STATUS */}

                          <td className="px-4 py-3.5 align-middle">
                            <StatusBadge
                              value={c.status}
                            />
                          </td>

                          {/* OFFENSE */}

                          <td className="px-4 py-3.5 text-center align-middle">
                            <span className="inline-flex min-w-[38px] items-center justify-center rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">
                              #{offenseNumber}
                            </span>
                          </td>

                          {/* DATE */}

                          <td className="whitespace-nowrap px-4 py-3.5 align-middle">
                            {fmt(
                              c.incident_date
                            )}
                          </td>

                          {/* ACTIONS */}

                          <td className="px-4 py-3.5 align-middle">
                            <div className="flex items-center justify-center gap-1">

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-md"
                                onClick={() =>
                                  setEditingCase(c)
                                }
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-md"
                                onClick={() =>
                                  setHistoryCase(c)
                                }
                                title="View History"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* =================================================
                PAGINATION
            ================================================= */}

            {!loading && filtered.length > 0 && (
              <div className="flex flex-col gap-3 border-t px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">

                <p className="text-xs text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {pageStart + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-foreground">
                    {Math.min(
                      pageEnd,
                      filtered.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground">
                    {filtered.length}
                  </span>{" "}
                  cases
                </p>

                <div className="flex items-center gap-1">

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.max(1, page - 1)
                      )
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {getPageNumbers().map(
                    (page, index) =>
                      page === "..." ? (
                        <span
                          key={`ellipsis-${index}`}
                          className="px-1.5 text-xs text-muted-foreground"
                        >
                          ...
                        </span>
                      ) : (
                        <Button
                          key={page}
                          variant={
                            currentPage === page
                              ? "default"
                              : "outline"
                          }
                          size="icon"
                          className="h-8 w-8 text-xs"
                          onClick={() =>
                            setCurrentPage(page)
                          }
                        >
                          {page}
                        </Button>
                      )
                  )}

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={
                      currentPage === totalPages
                    }
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.min(
                            totalPages,
                            page + 1
                          )
                      )
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* =====================================================
          EDIT MODAL
      ===================================================== */}

      {editingCase && (
        <EditCaseModal
          caseData={editingCase}
          onClose={() =>
            setEditingCase(null)
          }
          onSaved={load}
        />
      )}

      {/* =====================================================
          ADD MODAL
      ===================================================== */}

      {showAdd && (
        <AddCaseModal
          onClose={() => setShowAdd(false)}
          onSaved={load}
        />
      )}

      {/* =====================================================
          VIEW HISTORY MODAL
      ===================================================== */}

      <Dialog
        open={!!historyCase}
        onOpenChange={(open) => {
          if (!open) {
            setHistoryCase(null);
          }
        }}
      >
        <DialogContent className="max-h-[92vh] w-[95vw] max-w-[calc(100%-2rem)] gap-5 overflow-y-auto p-6 sm:max-w-5xl">

          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl">
              Offense History
            </DialogTitle>

            <DialogDescription className="text-base">
              All offense records for{" "}
              <span className="font-medium text-foreground">
                {historyStudentName}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border bg-muted/20 p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-sm text-muted-foreground">
                  All offenses for this student
                </p>

                <p className="mt-1 text-base font-semibold">
                  {historyStudentName}
                </p>
              </div>

              <div className="text-base text-muted-foreground">
                {historyRecords.length}{" "}
                {historyRecords.length === 1
                  ? "record"
                  : "records"}
              </div>

            </div>
          </div>

          {historyRecords.length === 0 ? (
            <div className="rounded-lg border px-4 py-12 text-center text-base text-muted-foreground">
              No offense history found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">

              <table className="w-full min-w-[860px] text-base">

                <thead>
                  <tr className="border-b bg-muted/40">

                    <th className="px-5 py-4 text-center text-sm font-semibold">
                      Offense
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold">
                      Case #
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold">
                      Violation
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold">
                      Date
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold">
                      Severity
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold">
                      Status
                    </th>

                    <th className="px-5 py-4 text-center text-sm font-semibold">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {historyRecords.map(
                    (record) => {
                      const offenseNumber =
                        offenseNumbers[
                          record.id
                        ] ||
                        record.offense_number ||
                        1;

                      return (
                        <tr
                          key={record.id}
                          className="border-b last:border-0 hover:bg-muted/20"
                        >

                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex min-w-[44px] justify-center rounded-full bg-muted px-3 py-1.5 text-sm font-semibold">
                              #{offenseNumber}
                            </span>
                          </td>

                          <td className="px-5 py-4 font-medium">
                            {record.case_number ||
                              "—"}
                          </td>

                          <td className="px-5 py-4">
                            {getViolationLabel(
                              record.violation
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            {fmt(
                              record.incident_date
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <SeverityBadge
                              value={
                                record.severity ||
                                getViolationSeverity(
                                  record.violation
                                )
                              }
                            />
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              value={
                                record.status
                              }
                            />
                          </td>

                          <td className="px-5 py-4 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1.5 text-sm"
                              onClick={() =>
                                setEditingCase(
                                  record
                                )
                              }
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                          </td>

                        </tr>
                      );
                    }
                  )}
                </tbody>

              </table>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setHistoryCase(null)
              }
            >
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>
    </div>
  );
}
