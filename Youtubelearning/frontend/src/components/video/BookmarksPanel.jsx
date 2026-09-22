import { useEffect, useMemo, useState } from "react";
import { Bookmark, Clock3, Play, Plus, Search, Trash2, X } from "lucide-react";

function formatTimestamp(seconds = 0) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hrs > 0) {
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(
      secs
    ).padStart(2, "0")}`;
  }

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function BookmarksPanel({
  bookmarks = [],
  loading = false,
  onCreateBookmark,
  onDeleteBookmark,
  onSeekToTimestamp,
  onGenerateRevisionFromBookmarks,
  getCurrentTimestamp,
  formOpenSignal = 0,
  initialTimestampSec = 0,
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [timestampSec, setTimestampSec] = useState(0);
  const [saving, setSaving] = useState(false);
  const [creatingRevision, setCreatingRevision] = useState(false);

  useEffect(() => {
    if (formOpenSignal > 0) {
      setIsFormOpen(true);
      if (initialTimestampSec !== undefined) {
        setTimestampSec(initialTimestampSec);
      }
    }
  }, [formOpenSignal, initialTimestampSec]);

  const sortedBookmarks = useMemo(() => {
    return [...bookmarks].sort((a, b) => {
      if ((a?.timestampSec || 0) !== (b?.timestampSec || 0)) {
        return (a?.timestampSec || 0) - (b?.timestampSec || 0);
      }
      return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
    });
  }, [bookmarks]);

  const filteredBookmarks = useMemo(() => {
    if (!searchQuery.trim()) return sortedBookmarks;
    const q = searchQuery.toLowerCase();
    return sortedBookmarks.filter((b) =>
      (b.label || "").toLowerCase().includes(q) ||
      (b.note || "").toLowerCase().includes(q)
    );
  }, [sortedBookmarks, searchQuery]);

  const setCurrentTimeToVideo = () => {
    const current = getCurrentTimestamp?.() || 0;
    setTimestampSec(current);
  };

  const handleCreate = async () => {
    if (!label.trim()) return;

    try {
      setSaving(true);
      await onCreateBookmark?.({
        label: label.trim(),
        note: note.trim(),
        timestampSec,
      });

      setLabel("");
      setNote("");
      setTimestampSec(0);
      setIsFormOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateRevision = async () => {
    try {
      setCreatingRevision(true);
      await onGenerateRevisionFromBookmarks?.();
    } finally {
      setCreatingRevision(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with compact trigger buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-600 dark:text-cyan-300">
            <Bookmark size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Bookmarks</h3>
            <p className="text-xs text-muted">
              {sortedBookmarks.length} bookmark{sortedBookmarks.length === 1 ? "" : "s"} saved
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setCurrentTimeToVideo();
              setIsFormOpen((prev) => !prev);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 text-xs font-medium shadow-xs transition"
          >
            {isFormOpen ? <X size={14} /> : <Plus size={14} />}
            {isFormOpen ? "Close Form" : "Add Bookmark"}
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
        <div className="rounded-[1.5rem] border border-cyan-500/20 bg-cyan-500/5 p-5 transition-all">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-300">
              New Bookmark
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
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Bookmark label (e.g. Important algorithm concept)"
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-cyan-500"
            />

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Short note (optional)"
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-cyan-500"
            />

            <div className="grid gap-3 md:grid-cols-[1fr_160px]">
              <button
                type="button"
                onClick={setCurrentTimeToVideo}
                className="flex items-center justify-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-gray-900 dark:text-white px-3 py-2.5 text-xs transition hover:bg-black/10 dark:hover:bg-white/10"
              >
                <Clock3 size={14} />
                Timestamp: {formatTimestamp(timestampSec)}
              </button>

              <button
                type="button"
                onClick={handleCreate}
                disabled={saving || !label.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50"
              >
                <Plus size={14} />
                {saving ? "Saving..." : "Save Bookmark"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Real-time Search Filter Bar */}
      {sortedBookmarks.length > 1 ? (
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${sortedBookmarks.length} bookmarks...`}
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] pl-9 pr-8 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-teal-500 transition"
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

      {/* Bookmarks List */}
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-[1.25rem] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4 text-xs text-muted">
            Loading bookmarks...
          </div>
        ) : sortedBookmarks.length ? (
          filteredBookmarks.length ? (
            filteredBookmarks.map((bookmark) => (
              <div
                key={bookmark._id}
                className="rounded-[1.25rem] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSeekToTimestamp?.(bookmark.timestampSec || 0)}
                        className="rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 active:scale-95 px-2.5 py-0.5 text-xs font-mono text-cyan-600 dark:text-cyan-300 transition flex items-center gap-1 group/time cursor-pointer"
                        title="Click to jump to timestamp"
                      >
                        <Play size={10} className="fill-current opacity-70 group-hover/time:opacity-100" />
                        <span>{formatTimestamp(bookmark.timestampSec || 0)}</span>
                      </button>

                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{bookmark.label}</p>
                    </div>

                    {bookmark.note ? (
                      <p className="text-xs text-muted whitespace-pre-wrap leading-relaxed">
                        {bookmark.note}
                      </p>
                    ) : null}
                  </div>

                  <button
                    onClick={() => onDeleteBookmark?.(bookmark._id)}
                    className="rounded-lg border border-rose-500/20 p-1.5 text-rose-500 dark:text-rose-300 transition hover:bg-rose-500/15"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[1.25rem] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4 text-xs text-muted text-center">
              No bookmarks match &ldquo;{searchQuery}&rdquo;.
            </div>
          )
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-[1.25rem] border border-dashed border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] p-4 text-xs">
            <div className="flex items-center gap-2.5 text-muted">
              <Bookmark size={15} className="text-cyan-500 shrink-0" />
              <span>No bookmarks yet. Pin important video timestamps to jump back later.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setCurrentTimeToVideo();
                setIsFormOpen(true);
              }}
              className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-600 dark:text-cyan-400 font-semibold px-3 py-1.5 transition"
            >
              <Plus size={12} />
              <span>Pin Timestamp</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}