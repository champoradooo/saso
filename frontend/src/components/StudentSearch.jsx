import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

export default function StudentSearch({
  students,
  value,
  onChange,
}) {
  const [query, setQuery] = useState("");
const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query) return students;

    const q = query.toLowerCase();

    return students.filter((s) =>
      `${s.first_name} ${s.last_name}`
        .toLowerCase()
        .includes(q) ||
      `${s.last_name} ${s.first_name}`
        .toLowerCase()
        .includes(q) ||
      s.student_id.toLowerCase().includes(q)
    );
  }, [students, query]);

  const selected = students.find(
    (s) => String(s.id) === String(value)
  );

  return (
    <div className="space-y-2">
      <Input
  placeholder="Search student..."
  value={
    open
      ? query
      : selected
      ? `${selected.last_name}, ${selected.first_name}`
      : ""
  }
  onFocus={() => {
    setQuery("");
    setOpen(true);
  }}
  onChange={(e) => {
    setQuery(e.target.value);
    setOpen(true);
  }}
/>

      {open && (
  <div className="border rounded-md max-h-56 overflow-y-auto bg-white">
        {filtered.length === 0 ? (
          <div className="p-3 text-sm text-muted-foreground">
            No students found.
          </div>
        ) : (
          filtered.map((student) => (
            <button
              type="button"
              key={student.id}
              onClick={() => {
  onChange(String(student.id));
  setQuery("");
  setOpen(false);
}}
              className={`w-full text-left px-3 py-2 hover:bg-muted transition ${
                String(value) === String(student.id)
                  ? "bg-primary text-white"
                  : ""
              }`}
            >
              <div className="font-medium">
                {student.last_name}, {student.first_name}
              </div>

              <div className="text-xs opacity-70">
                {student.student_id}
              </div>
            </button>
          ))
        )}
      </div>
)}

    </div>
  );
}