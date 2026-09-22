import { useEffect, useMemo, useState } from "react";
import {
  Clock3,
  FileText,
  Pencil,
  Play,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

function formatTimestamp(seconds = 0) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hrs > 0) {
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  }

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function parseTags(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function NotesPanel({
  notes = [],
  loading = false,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onSeekToTimestamp,
  getCurrentTimestamp,
  onGenerateRevisionFromNotes,
  formOpenSignal = 0,
  initialTimestampSec = 0,
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [timestampSec, setTimestampSec] = useState(0);
  const [saving, setSaving] = useState(false);
  const [creatingRevision, setCreatingRevision] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTagsInput, setEditTagsInput] = useState("");
  const [editTimestampSec, setEditTimestampSec] = useState(0);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (formOpenSignal > 0) {
      setIsFormOpen(true);
      if (initialTimestampSec !== undefined) {
        setTimestampSec(initialTimestampSec);
      }
    }
  }, [formOpenSignal, initialTimestampSec]);

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      if ((a?.timestampSec || 0) !== (b?.timestampSec || 0)) {
        return (a?.timestampSec || 0) - (b?.timestampSec || 0);
      }
      return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
    });
  }, [notes]);

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return sortedNotes;
    const q = searchQuery.toLowerCase();
    return sortedNotes.filter((n) =>
      (n.title || "").toLowerCase().includes(q) ||
      (n.content || "").toLowerCase().includes(q) ||
      (n.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }, [sortedNotes, searchQuery]);

  const handleUseCurrentTime = () => {
    const current = getCurrentTimestamp?.() || 0;
    setTimestampSec(current);
  };

  const handleCreate = async () => {
    if (!content.trim()) return;

    try {
      setSaving(true);
      await onCreateNote?.({
        title: title.trim(),
        content: content.trim(),
        timestampSec,
        tags: parseTags(tagsInput),
      });

      setTitle("");
      setContent("");
      setTagsInput("");
      setTimestampSec(0);
      setIsFormOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateRevision = async () => {
    try {
      setCreatingRevision(true);
      await onGenerateRevisionFromNotes?.();
    } finally {
      setCreatingRevision(false);
    }
  };

  const startEdit = (note) => {
    setEditingId(note._id);
    setEditTitle(note.title || "");
    setEditContent(note.content || "");
    setEditTagsInput(Array.isArray(note.tags) ? note.tags.join(", ") : "");
    setEditTimestampSec(note.timestampSec || 0);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
    setEditTagsInput("");
    setEditTimestampSec(0);
  };

  const saveEdit = async () => {
    if (!editingId || !editContent.trim()) return;

    try {
      setUpdating(true);
      await onUpdateNote?.(editingId, {
        title: editTitle.trim(),
        content: editContent.trim(),
        timestampSec: editTimestampSec,
        tags: parseTags(editTagsInput),
      });
      cancelEdit();
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with compact trigger buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-500/10 p-2 text-blue-600 dark:text-blue-300">
            <FileText size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notes</h3>
            <p className="text-xs text-muted">
              {sortedNotes.length} note{sortedNotes.length === 1 ? "" : "s"} saved
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              handleUseCurrentTime();
              setIsFormOpen((prev) => !prev);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 text-xs font-medium shadow-xs transition"
          >
            {isFormOpen ? <X size={14} /> : <Plus size={14} />}
            {isFormOpen ? "Close Form" : "Add Note"}
          </button>

          <button
            type="button"
            onClick={handleGenerateRevision}
            disabled={creatingRevision}
            className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-gray-900 dark:text-white px-3.5 py-2 text-xs font-medium transition hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-70"
          >
            {creatingRevision ? "Creating..." : "Create Revision"}
          </button>
        </div>
      </div>

      {/* Collapsible Form Section */}
      {isFormOpen ? (
        <div className="rounded-[1.5rem] border border-blue-500/20 bg-blue-500/5 p-5 transition-all">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-300">
              New Timestamp Note
            </p>
            <button
              onClick={() => setIsFormOpen(false)}
              className="rounded-lg p-1 text-muted hover:bg-black/10 dark:hover:bg-white/10"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title (optional)"
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
            />

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note..."
              rows={3}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
            />

            <div className="grid gap-3 md:grid-cols-[1fr_160px]">
              <input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Tags: xss, auth, revision"
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
              />

              <button
                type="button"
                onClick={handleUseCurrentTime}
                className="flex items-center justify-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-gray-900 dark:text-white px-3 py-2.5 text-xs transition hover:bg-black/10 dark:hover:bg-white/10"
              >
                <Clock3 size={14} />
                {formatTimestamp(timestampSec)}
              </button>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleCreate}
                disabled={saving || !content.trim()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50"
              >
                <Plus size={14} />
                {saving ? "Saving..." : "Save Note"}
              </button>

              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-xl border border-black/10 dark:border-white/10 text-gray-900 dark:text-white px-4 py-2.5 text-xs font-medium transition hover:bg-black/5 dark:hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Real-time Search Filter Bar */}
      {sortedNotes.length > 1 ? (
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${sortedNotes.length} notes by keyword or tag...`}
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] pl-9 pr-8 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-gray-900 dark:hover:text-white"
            >
              <X size={12} />
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Notes List */}
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-[1.25rem] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4 text-xs text-muted">
            Loading notes...
          </div>
        ) : sortedNotes.length ? (
          filteredNotes.length ? (
            filteredNotes.map((note) => {
              const isEditing = editingId === note._id;

              return (
                <div
                  key={note._id}
                  className="rounded-[1.25rem] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Note title"
                        className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none"
                      />

                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none"
                      />

                      <div className="grid gap-3 md:grid-cols-[1fr_140px]">
                        <input
                          value={editTagsInput}
                          onChange={(e) => setEditTagsInput(e.target.value)}
                          placeholder="Tags"
                          className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-4 py-2 text-sm text-gray-900 dark:text-white outline-none"
                        />

                        <input
                          type="number"
                          min="0"
                          value={editTimestampSec}
                          onChange={(e) =>
                            setEditTimestampSec(Number(e.target.value) || 0)
                          }
                          className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-white outline-none"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={saveEdit}
                          disabled={updating || !editContent.trim()}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3.5 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-300 transition"
                        >
                          <Save size={14} />
                          {updating ? "Saving..." : "Save"}
                        </button>

                        <button
                          onClick={cancelEdit}
                          className="inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 text-gray-900 dark:text-white px-3.5 py-2 text-xs font-medium transition hover:bg-black/5 dark:hover:bg-white/10"
                        >
                          <X size={14} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onSeekToTimestamp?.(note.timestampSec || 0)}
                            title="Click to jump to this moment in video"
                            className="rounded-full bg-blue-500/10 hover:bg-blue-500/20 active:scale-95 px-2.5 py-0.5 text-xs text-blue-600 dark:text-blue-300 font-mono transition flex items-center gap-1 group/time cursor-pointer"
                          >
                            <Play size={10} className="fill-current opacity-70 group-hover/time:opacity-100" />
                            <span>{formatTimestamp(note.timestampSec || 0)}</span>
                          </button>

                          {note.title ? (
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{note.title}</span>
                          ) : null}
                        </div>

                        <p className="whitespace-pre-wrap text-xs text-muted leading-relaxed">
                          {note.content}
                        </p>

                        {Array.isArray(note.tags) && note.tags.length ? (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {note.tags.map((tag) => (
                              <span
                                key={`${note._id}-${tag}`}
                                className="rounded-md border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/20 px-2 py-0.5 text-[11px] text-muted"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex gap-1.5">
                      <button
                        onClick={() => startEdit(note)}
                        className="rounded-lg border border-black/10 dark:border-white/10 p-1.5 text-gray-900 dark:text-white transition hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        <Pencil size={13} />
                      </button>

                      <button
                        onClick={() => onDeleteNote?.(note._id)}
                        className="rounded-lg border border-rose-500/20 p-1.5 text-rose-500 dark:text-rose-300 transition hover:bg-rose-500/15"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
                </div>
              );
            })
          ) : (
            <div className="rounded-[1.25rem] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4 text-xs text-muted text-center">
              No notes match &ldquo;{searchQuery}&rdquo;. Try another search term.
            </div>
          )
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-[1.25rem] border border-dashed border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] p-4 text-xs">
            <div className="flex items-center gap-2.5 text-muted">
              <FileText size={15} className="text-blue-500 shrink-0" />
              <span>No notes yet for this video. Capture your thoughts and key insights.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                handleUseCurrentTime();
                setIsFormOpen(true);
              }}
              className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 font-semibold px-3 py-1.5 transition"
            >
              <Plus size={12} />
              <span>Create Note</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}