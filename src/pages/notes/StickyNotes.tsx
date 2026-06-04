import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  Archive,
  ArchiveRestore,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileText,
  GripVertical,
  Loader2,
  Paperclip,
  Pencil,
  Pin,
  PinOff,
  Play,
  Plus,
  RotateCcw,
  Search,
  StickyNote,
  Tag,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import toast from "react-hot-toast";
import { ApiError } from "../../apis/apiService";
import {
  useCreateNote,
  useDeleteNote,
  useDeleteNoteAttachment,
  useMyNotes,
  usePatchNote,
  useUploadNoteAttachment,
} from "../../apis/api/notes";
import type { NoteAttachment, NoteChecklistItem, StickyNote as StickyNoteType } from "../../types/notes.types";
import Button from "../../components/UI/Button";
import Input from "../../components/UI/Input";
import { StickyNotesBoardSkeleton } from "../../components/UI/Skeleton";
import {
  STICKY_COLOR_OPTIONS,
  stickyCardClasses,
  type StickyColorId,
} from "../../utils/stickyNoteTheme";

// ─── helpers ────────────────────────────────────────────────────────────────

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function formatWhen(iso?: string) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageMime(mime: string) {
  return mime.startsWith("image/");
}

function isVideoMime(mime: string) {
  return mime.startsWith("video/");
}

/** Raw-type Cloudinary URLs (/raw/upload/) serve real PDF bytes; image-type ones don't. */
function isEmbeddablePdf(url: string): boolean {
  if (!url.includes("cloudinary.com")) return true;
  return url.includes("/raw/upload/");
}


function matchesSearch(note: StickyNoteType, q: string): boolean {
  if (!q) return true;
  const lower = q.toLowerCase();
  return (
    note.title.toLowerCase().includes(lower) ||
    note.content.toLowerCase().includes(lower) ||
    (note.tags ?? []).some((t) => t.toLowerCase().includes(lower))
  );
}

// ─── color swatches ──────────────────────────────────────────────────────────

function ColorSwatches({
  value,
  onChange,
}: {
  value: StickyColorId;
  onChange: (c: StickyColorId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="list" aria-label="Note color">
      {STICKY_COLOR_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="listitem"
          title={opt.label}
          onClick={() => onChange(opt.id)}
          className={`
            h-7 w-7 rounded-full shadow-sm ring-2 ring-offset-2 transition-transform hover:scale-110
            focus:outline-none focus-visible:ring-violet-500
            ${opt.swatch}
            ${value === opt.id ? "ring-violet-600 ring-offset-white scale-110" : "ring-transparent ring-offset-transparent"}
          `}
        />
      ))}
    </div>
  );
}

// ─── tag input ────────────────────────────────────────────────────────────────

function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const t = input.trim().toLowerCase();
    if (!t || tags.includes(t) || tags.length >= 10) return;
    onChange([...tags, t]);
    setInput("");
  };

  const remove = (tag: string) => onChange(tags.filter((t) => t !== tag));

  const handleKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !input && tags.length) {
      remove(tags[tags.length - 1]);
    }
  };

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">
        Tags
      </label>
      <div className="flex min-h-[2.25rem] flex-wrap gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-2 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="ml-0.5 text-violet-400 hover:text-violet-700"
              aria-label={`Remove tag ${tag}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={add}
          placeholder={tags.length < 10 ? "Add tag…" : "Max 10 tags"}
          disabled={tags.length >= 10}
          className="min-w-[80px] flex-1 bg-transparent text-xs outline-none placeholder:text-gray-400 disabled:cursor-not-allowed"
        />
      </div>
      <p className="mt-1 text-[11px] text-gray-400">Enter or comma to add · max 10</p>
    </div>
  );
}

// ─── checklist editor ─────────────────────────────────────────────────────────

type ChecklistDraft = { id: string; text: string; checked: boolean };

function ChecklistEditor({
  items,
  onChange,
}: {
  items: ChecklistDraft[];
  onChange: (items: ChecklistDraft[]) => void;
}) {
  const [input, setInput] = useState("");

  const addItem = () => {
    const text = input.trim();
    if (!text || items.length >= 30) return;
    onChange([...items, { id: crypto.randomUUID(), text, checked: false }]);
    setInput("");
  };

  const removeItem = (id: string) => onChange(items.filter((i) => i.id !== id));

  const toggleItem = (id: string) =>
    onChange(items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));

  const doneCount = items.filter((i) => i.checked).length;
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Checklist
        </label>
        {items.length > 0 && (
          <span className="text-[11px] font-medium text-gray-400">
            {doneCount}/{items.length}
          </span>
        )}
      </div>

      {items.length > 0 && (
        <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-violet-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <div className="mb-2 max-h-44 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1.5"
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => toggleItem(item.id)}
              className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-violet-600"
            />
            <span
              className={`flex-1 text-xs ${item.checked ? "text-gray-400 line-through" : "text-gray-700"}`}
            >
              {item.text}
            </span>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="text-gray-300 hover:text-red-500"
              aria-label="Remove item"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); addItem(); }
          }}
          placeholder={items.length < 30 ? "Add item…" : "Max 30 items"}
          disabled={items.length >= 30}
          className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs outline-none placeholder:text-gray-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={addItem}
          disabled={!input.trim() || items.length >= 30}
          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-violet-600 transition hover:bg-violet-50 disabled:pointer-events-none disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ─── pdf fallback card ────────────────────────────────────────────────────────

function PdfFallback({ att }: { att: NoteAttachment }) {
  return (
    <div className="flex h-full w-full min-h-[280px] flex-col items-center justify-center gap-5 rounded-xl bg-white px-8 text-center shadow-2xl">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50">
        <FileText className="h-10 w-10 text-red-400" />
      </div>
      <div>
        <p className="text-base font-semibold text-gray-900">{att.name}</p>
        <p className="mt-1 text-sm text-gray-500">PDF preview is not available in the browser.</p>
      </div>
      <div className="flex gap-3">
        <a
          href={att.url}
          download={att.name}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-violet-700"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </a>
        <a
          href={att.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow transition hover:bg-gray-50"
        >
          <ExternalLink className="h-4 w-4" />
          Open in tab
        </a>
      </div>
    </div>
  );
}

// ─── file preview modal ───────────────────────────────────────────────────────

function FilePreviewModal({
  attachments,
  startIndex,
  onClose,
}: {
  attachments: NoteAttachment[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const att = attachments[idx];
  const isImage = att ? isImageMime(att.mimeType) : false;
  const isVideo = att ? isVideoMime(att.mimeType) : false;
  const isPdf = att?.mimeType === "application/pdf";
  const hasPrev = idx > 0;
  const hasNext = idx < attachments.length - 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) setIdx((i) => i - 1);
      if (e.key === "ArrowRight" && hasNext) setIdx((i) => i + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasPrev, hasNext, onClose]);

  if (!att) return null;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* nav arrows */}
      {hasPrev && (
        <button
          type="button"
          onClick={() => setIdx((i) => i - 1)}
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition hover:bg-white/25"
          aria-label="Previous"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {hasNext && (
        <button
          type="button"
          onClick={() => setIdx((i) => i + 1)}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition hover:bg-white/25"
          aria-label="Next"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* top bar */}
      <div className="relative z-10 flex w-full max-w-4xl items-center justify-between px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{att.name}</p>
          <p className="text-xs text-white/50">
            {formatBytes(att.size)}
            {attachments.length > 1 && (
              <span className="ml-2">{idx + 1} / {attachments.length}</span>
            )}
          </p>
        </div>
        <div className="ml-4 flex shrink-0 items-center gap-2">
          <a
            href={att.url}
            download={att.name}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/25"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
          <a
            href={att.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-white/10 p-1.5 text-white backdrop-blur-sm transition hover:bg-white/25"
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white/10 p-1.5 text-white backdrop-blur-sm transition hover:bg-white/25"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* content */}
      <div className="relative z-10 flex w-full max-w-4xl flex-1 items-center justify-center overflow-hidden px-4 pb-4">
        {isImage ? (
          <img
            src={att.url}
            alt={att.name}
            className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-2xl"
          />
        ) : isVideo ? (
          <video
            src={att.url}
            controls
            autoPlay={false}
            className="max-h-[75vh] max-w-full rounded-xl shadow-2xl"
          >
            Your browser does not support video playback.
          </video>
        ) : isPdf ? (
          isEmbeddablePdf(att.url) ? (
            <div className="relative h-[75vh] w-full overflow-hidden rounded-xl shadow-2xl">
              <object data={att.url} type="application/pdf" className="h-full w-full">
                <PdfFallback att={att} />
              </object>
            </div>
          ) : (
            <PdfFallback att={att} />
          )
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-white/10 px-10 py-12 text-center backdrop-blur-sm">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20">
              <FileText className="h-10 w-10 text-white" />
            </div>
            <div>
              <p className="text-base font-semibold text-white">{att.name}</p>
              <p className="mt-1 text-sm text-white/60">{formatBytes(att.size)}</p>
            </div>
            <a
              href={att.url}
              download={att.name}
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-lg transition hover:bg-gray-100"
            >
              <Download className="h-4 w-4" />
              Download file
            </a>
          </div>
        )}
      </div>

      {/* thumbnail strip (when multiple) */}
      {attachments.length > 1 && (
        <div className="relative z-10 flex items-center gap-2 pb-4">
          {attachments.map((a, i) => (
            <button
              key={a._id}
              type="button"
              onClick={() => setIdx(i)}
              className={`h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === idx ? "border-white scale-110" : "border-transparent opacity-50 hover:opacity-80"
              }`}
            >
              {isImageMime(a.mimeType) ? (
                <img src={a.url} alt={a.name} className="h-full w-full object-cover" />
              ) : isVideoMime(a.mimeType) ? (
                <div className="flex h-full w-full items-center justify-center bg-white/20">
                  <Play className="h-5 w-5 text-white" />
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/20">
                  <FileText className="h-5 w-5 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}

// ─── attachment viewer (inside edit panel) ────────────────────────────────────

function AttachmentList({
  noteId,
  attachments,
}: {
  noteId: string;
  attachments: NoteAttachment[];
}) {
  const deleteAtt = useDeleteNoteAttachment();
  const uploadAtt = useUploadNoteAttachment();
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (attachments.length >= 10) { toast.error("Max 10 attachments per note"); return; }
    try {
      await uploadAtt.mutateAsync({ id: noteId, file });
      toast.success("File attached");
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Upload failed");
    }
  };

  const handleDelete = async (attachmentId: string) => {
    try {
      await deleteAtt.mutateAsync({ id: noteId, attachmentId });
      toast.success("Attachment removed");
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Could not remove attachment");
    }
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Attachments
        </label>
        <span className="text-[11px] text-gray-400">{attachments.length}/10</span>
      </div>

      {attachments.length > 0 && (
        <div className="mb-2 space-y-1.5">
          {attachments.map((att, i) => (
            <div
              key={att._id}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2"
            >
              <button
                type="button"
                onClick={() => setPreviewIdx(i)}
                className="shrink-0 overflow-hidden rounded-lg transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                title="Preview"
              >
                {isImageMime(att.mimeType) ? (
                  <img src={att.url} alt={att.name} className="h-10 w-10 object-cover" />
                ) : isVideoMime(att.mimeType) ? (
                  <div className="flex h-10 w-10 items-center justify-center bg-sky-100">
                    <Play className="h-5 w-5 text-sky-500" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center bg-violet-100">
                    <FileText className="h-5 w-5 text-violet-500" />
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={() => setPreviewIdx(i)}
                className="min-w-0 flex-1 text-left"
                title="Preview"
              >
                <p className="truncate text-xs font-medium text-gray-700 hover:text-violet-600">{att.name}</p>
                <p className="text-[10px] text-gray-400">{formatBytes(att.size)}</p>
              </button>
              <button
                type="button"
                onClick={() => handleDelete(att._id)}
                disabled={deleteAtt.isPending}
                className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                title="Remove attachment"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept="image/*,video/*,.pdf,.doc,.docx,.xlsx,.csv"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={attachments.length >= 10 || uploadAtt.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 py-2 text-xs font-medium text-gray-500 transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-600 disabled:pointer-events-none disabled:opacity-40"
      >
        {uploadAtt.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Paperclip className="h-3.5 w-3.5" />
        )}
        {uploadAtt.isPending ? "Uploading…" : "Attach file"}
      </button>

      {previewIdx !== null && (
        <FilePreviewModal
          attachments={attachments}
          startIndex={previewIdx}
          onClose={() => setPreviewIdx(null)}
        />
      )}
    </div>
  );
}

// ─── edit note panel (right slide-over) ───────────────────────────────────────

function EditNotePanel({
  note,
  onSave,
  onClose,
  isSaving,
}: {
  note: StickyNoteType;
  onSave: (body: {
    title: string;
    content: string;
    color: StickyColorId;
    tags: string[];
    checklist: Array<{ text: string; checked: boolean }>;
  }) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [color, setColor] = useState<StickyColorId>(note.color ?? "lemon");
  const [tags, setTags] = useState<string[]>(note.tags ?? []);
  const [checklist, setChecklist] = useState<ChecklistDraft[]>(
    (note.checklist ?? []).map((i) => ({ id: i._id, text: i.text, checked: i.checked }))
  );
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  const colorOpt = STICKY_COLOR_OPTIONS.find((o) => o.id === color) ?? STICKY_COLOR_OPTIONS[0];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    const c = content.trim();
    if (!t || !c) { toast.error("Title and content are required."); return; }
    onSave({
      title: t,
      content: c,
      color,
      tags,
      checklist: checklist.map((i) => ({ text: i.text, checked: i.checked })),
    });
  };

  return (
    <div
      className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-panel-title"
    >
      {/* colored header */}
      <div className={`bg-gradient-to-br ${colorOpt.card} shrink-0 px-5 pt-5 pb-4`}>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 opacity-60">
            <StickyNote className="h-3.5 w-3.5" />
            <span id="edit-panel-title" className="text-[10px] font-black uppercase tracking-widest">
              Edit note
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 opacity-60 transition hover:bg-black/10 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title…"
          className="w-full bg-transparent text-lg font-bold outline-none placeholder:opacity-30"
        />

        <div className="mt-3 flex items-center gap-2 border-t border-black/10 pt-3">
          <span className="text-[10px] font-bold uppercase tracking-wide opacity-50">Color</span>
          <ColorSwatches value={color} onChange={setColor} />
        </div>
      </div>

      {/* scrollable body */}
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-col gap-5 overflow-y-auto px-5 py-5">
          {/* content */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">
              Note
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note here…"
              rows={4}
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm leading-relaxed text-gray-700 outline-none placeholder:text-gray-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          {/* checklist */}
          <ChecklistEditor items={checklist} onChange={setChecklist} />

          {/* attachments */}
          <AttachmentList
            noteId={note._id}
            attachments={note.attachments ?? []}
          />

          {/* tags */}
          <TagInput tags={tags} onChange={setTags} />
        </div>

        {/* footer */}
        <div className="shrink-0 flex items-center justify-between border-t border-gray-100 bg-gray-50/60 px-5 py-3.5">
          {note.updatedAt ? (
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <Clock className="h-3 w-3" />
              {formatWhen(note.updatedAt)}
            </span>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="text-sm">
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving} className="text-sm">
              {isSaving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Save changes"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── delete confirm dialog ────────────────────────────────────────────────────

function DeleteConfirmDialog({
  open,
  onConfirm,
  onCancel,
  isLoading,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={onCancel}
        aria-label="Cancel"
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-100">
          <Trash2 className="h-5 w-5 text-red-600" />
        </div>
        <h3 className="mb-1 text-base font-semibold text-gray-900">Delete note?</h3>
        <p className="mb-5 text-sm text-gray-500">
          This note will be permanently deleted and cannot be recovered.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            className="flex-1 !bg-red-600 !shadow-none hover:!bg-red-700"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── constants ────────────────────────────────────────────────────────────────

const ZOOM_MIN = 0.35;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.12;

function randomBoardPosition() {
  return { positionX: 12 + Math.random() * 48, positionY: 10 + Math.random() * 38 };
}

// ─── types ────────────────────────────────────────────────────────────────────

type DragSession = {
  id: string;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
  boardW: number;
  boardH: number;
  el: HTMLElement;
};

// ─── main component ───────────────────────────────────────────────────────────

export default function StickyNotes() {
  // refs
  const boardRef = useRef<HTMLDivElement>(null);
  const dragSession = useRef<DragSession | null>(null);
  const zoomRef = useRef(1);
  const rafId = useRef<number | null>(null);
  const pendingDragPos = useRef<{ dx: number; dy: number; z: number } | null>(null);

  // ui state
  const [createPanelOpen, setCreatePanelOpen] = useState(false);
  const [editPanelNoteId, setEditPanelNoteId] = useState<string | null>(null);
  const [cardPreview, setCardPreview] = useState<{ attachments: NoteAttachment[]; index: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    noteId: string | null;
  }>({ open: false, noteId: null });

  // create form state
  const [createTitle, setCreateTitle] = useState("");
  const [createContent, setCreateContent] = useState("");
  const [createColor, setCreateColor] = useState<StickyColorId>("lemon");
  const [createTags, setCreateTags] = useState<string[]>([]);

  // data & mutations
  const { data, isLoading, isError, error } = useMyNotes(showArchived);
  const createMut = useCreateNote();
  const patchMut = usePatchNote();
  const deleteMut = useDeleteNote();
  const patchMutRef = useRef(patchMut);

  useLayoutEffect(() => {
    patchMutRef.current = patchMut;
    zoomRef.current = zoom;
  });

  const allNotes = data?.notes ?? [];
  const notes = searchQuery
    ? allNotes.filter((n) => matchesSearch(n, searchQuery))
    : allNotes;

  const editPanelNote = editPanelNoteId
    ? allNotes.find((n) => n._id === editPanelNoteId) ?? null
    : null;

  const editPanelOpen = !!editPanelNote;

  // ─── create panel ──────────────────────────────────────────────────────────

  const openCreate = () => {
    setCreateTitle("");
    setCreateContent("");
    setCreateColor("lemon");
    setCreateTags([]);
    setCreatePanelOpen(true);
    setEditPanelNoteId(null);
  };

  const closeCreate = () => setCreatePanelOpen(false);

  // ─── drag system ─────────────────────────────────────────────────────────────

  function notePosition(note: StickyNoteType) {
    return { x: note.positionX ?? 12, y: note.positionY ?? 12 };
  }

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const s = dragSession.current;
      if (!s) return;
      e.preventDefault();
      pendingDragPos.current = {
        dx: e.clientX - s.startClientX,
        dy: e.clientY - s.startClientY,
        z: zoomRef.current,
      };
      if (rafId.current !== null) return;
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        const pos = pendingDragPos.current;
        const session = dragSession.current;
        if (!pos || !session) return;
        session.el.style.transform = `translate3d(${pos.dx / pos.z}px, ${pos.dy / pos.z}px, 0)`;
      });
    };

    const finishDrag = (e: PointerEvent) => {
      const s = dragSession.current;
      if (!s) return;
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      pendingDragPos.current = null;
      dragSession.current = null;
      const dxPct = ((e.clientX - s.startClientX) / s.boardW) * 100;
      const dyPct = ((e.clientY - s.startClientY) / s.boardH) * 100;
      const nx = clamp(s.originX + dxPct, 0, 82);
      const ny = clamp(s.originY + dyPct, 0, 78);
      s.el.style.left = `${nx}%`;
      s.el.style.top = `${ny}%`;
      s.el.style.transform = "";
      s.el.style.zIndex = "";
      s.el.style.willChange = "";
      s.el.classList.remove("sticky-note--dragging");
      document.body.style.userSelect = "";
      patchMutRef.current.mutate(
        { id: s.id, body: { positionX: nx, positionY: ny } },
        {
          onError: (err) =>
            toast.error((err as ApiError)?.message ?? "Could not save position"),
        }
      );
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  // ─── zoom ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom((z) => clamp(z + (e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP), ZOOM_MIN, ZOOM_MAX));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const zoomOut = () => setZoom((z) => clamp(z - ZOOM_STEP, ZOOM_MIN, ZOOM_MAX));
  const zoomIn = () => setZoom((z) => clamp(z + ZOOM_STEP, ZOOM_MIN, ZOOM_MAX));
  const zoomReset = () => setZoom(1);

  // ─── grip drag ────────────────────────────────────────────────────────────

  const handleGripDown = useCallback((e: ReactPointerEvent, note: StickyNoteType) => {
    if (!boardRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const article = (e.currentTarget as HTMLElement).closest(
      "[data-sticky-note]"
    ) as HTMLElement | null;
    if (!article) return;
    const br = boardRef.current.getBoundingClientRect();
    const pos = notePosition(note);
    dragSession.current = {
      id: note._id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      originX: pos.x,
      originY: pos.y,
      boardW: br.width,
      boardH: br.height,
      el: article,
    };
    article.style.zIndex = "60";
    article.style.willChange = "transform";
    article.classList.add("sticky-note--dragging");
    document.body.style.userSelect = "none";
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* older browsers */
    }
  }, []);

  // ─── note actions ────────────────────────────────────────────────────────

  const handleColorChange = (noteId: string, color: StickyColorId) => {
    patchMut.mutate(
      { id: noteId, body: { color } },
      { onError: (err) => toast.error((err as ApiError)?.message ?? "Could not update color") }
    );
  };

  const handleTogglePin = (note: StickyNoteType) => {
    patchMut.mutate(
      { id: note._id, body: { isPinned: !note.isPinned } },
      { onError: (err) => toast.error((err as ApiError)?.message ?? "Could not update note") }
    );
  };

  const handleToggleArchive = (note: StickyNoteType) => {
    patchMut.mutate(
      { id: note._id, body: { isArchived: !note.isArchived } },
      {
        onSuccess: () => toast.success(note.isArchived ? "Note restored" : "Note archived"),
        onError: (err) => toast.error((err as ApiError)?.message ?? "Could not update note"),
      }
    );
  };

  const handleDeleteConfirm = (noteId: string) =>
    setDeleteConfirm({ open: true, noteId });

  const handleDeleteExecute = () => {
    const id = deleteConfirm.noteId;
    if (!id) return;
    deleteMut.mutate(id, {
      onSuccess: () => {
        toast.success("Note deleted");
        setDeleteConfirm({ open: false, noteId: null });
        if (editPanelNoteId === id) setEditPanelNoteId(null);
      },
      onError: (err) =>
        toast.error((err as ApiError)?.message ?? "Could not delete note"),
    });
  };

  // ─── create submit ──────────────────────────────────────────────────────

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const t = createTitle.trim();
    const c = createContent.trim();
    if (!t || !c) { toast.error("Title and note text are required."); return; }
    try {
      const pos = randomBoardPosition();
      await createMut.mutateAsync({ title: t, content: c, color: createColor, tags: createTags, ...pos });
      toast.success("Sticky added to your board");
      closeCreate();
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Could not save note");
    }
  };

  // ─── edit save ──────────────────────────────────────────────────────────

  const handleEditSave = async (body: {
    title: string;
    content: string;
    color: StickyColorId;
    tags: string[];
    checklist: Array<{ text: string; checked: boolean }>;
  }) => {
    if (!editPanelNoteId) return;
    try {
      await patchMut.mutateAsync({ id: editPanelNoteId, body });
      toast.success("Note updated");
      setEditPanelNoteId(null);
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Could not update note");
    }
  };

  // ─── render ──────────────────────────────────────────────────────────────

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {/* ── toolbar ── */}
      <div className="flex shrink-0 flex-col gap-3 border-b border-gray-200/80 bg-white/90 px-4 py-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0 space-y-0.5">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-gray-900 sm:text-xl">
            <StickyNote className="h-6 w-6 shrink-0 text-amber-500" aria-hidden />
            Sticky notes
          </h2>
          <p className="text-xs text-gray-500 sm:text-sm">
            Drag by the grip.{" "}
            <span className="hidden sm:inline">
              Click a note to edit · Zoom: buttons or Ctrl/⌘ + scroll.
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes…"
              className="h-9 w-40 rounded-xl border border-gray-200/90 bg-white/95 pl-9 pr-3 text-sm shadow-sm outline-none transition placeholder:text-gray-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 sm:w-48"
            />
          </div>

          {/* active / archived toggle */}
          <div
            className="flex items-center gap-0.5 rounded-xl border border-gray-200/90 bg-white/95 p-0.5 shadow-sm"
            role="group"
            aria-label="Note view"
          >
            <button
              type="button"
              onClick={() => { setShowArchived(false); setSearchQuery(""); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${!showArchived ? "bg-violet-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => { setShowArchived(true); setSearchQuery(""); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${showArchived ? "bg-violet-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}
            >
              Archived
            </button>
          </div>

          {/* zoom */}
          <div
            className="flex items-center gap-0.5 rounded-xl border border-gray-200/90 bg-white/95 p-0.5 shadow-sm"
            role="group"
            aria-label="Board zoom"
          >
            <button type="button" onClick={zoomOut} disabled={zoom <= ZOOM_MIN + 0.001}
              className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-35"
              title="Zoom out" aria-label="Zoom out">
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="min-w-[2.85rem] px-1 text-center text-xs font-semibold tabular-nums text-gray-700">
              {Math.round(zoom * 100)}%
            </span>
            <button type="button" onClick={zoomIn} disabled={zoom >= ZOOM_MAX - 0.001}
              className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-35"
              title="Zoom in" aria-label="Zoom in">
              <ZoomIn className="h-4 w-4" />
            </button>
            <button type="button" onClick={zoomReset}
              className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
              title="Reset zoom" aria-label="Reset zoom">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {!showArchived && (
            <Button type="button" variant="primary" onClick={openCreate}
              className="inline-flex shrink-0 items-center gap-2 shadow-[0_8px_24px_rgba(109,40,217,0.22)]">
              <Plus className="h-4 w-4" />
              New sticky
            </Button>
          )}
        </div>
      </div>

      {/* ── board + edit panel wrapper ── */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* ── board ── */}
        <section
          ref={boardRef}
          aria-label="Sticky note board"
          className="relative min-h-0 flex-1 overflow-auto bg-[linear-gradient(to_bottom,rgb(248,250,252)_0%,rgb(241,245,249)_42%,rgb(236,241,247)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-inset ring-gray-200/50"
        >
          <div
            className="relative origin-top-left will-change-transform"
            style={{
              width: `${100 / zoom}%`,
              height: `${100 / zoom}%`,
              minHeight: "100%",
              transform: `scale(${zoom})`,
              transformOrigin: "0 0",
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(203,213,225)_1px,transparent_0)] [background-size:24px_24px] opacity-[0.35]" />
            <div className="relative h-full min-h-full min-w-full w-full">
              {isLoading ? (
                <StickyNotesBoardSkeleton />
              ) : isError ? (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800">
                    {(error as Error)?.message ?? "Could not load notes."}
                  </div>
                </div>
              ) : notes.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <StickyNote className="h-12 w-12 text-gray-300" />
                  {searchQuery ? (
                    <p className="max-w-sm text-sm text-gray-500">
                      No notes match{" "}
                      <span className="font-medium text-gray-700">"{searchQuery}"</span>.{" "}
                      <button type="button" onClick={() => setSearchQuery("")}
                        className="text-violet-600 underline-offset-2 hover:underline">
                        Clear search
                      </button>
                    </p>
                  ) : showArchived ? (
                    <p className="max-w-sm text-sm text-gray-500">No archived notes.</p>
                  ) : (
                    <p className="max-w-sm text-sm text-gray-500">
                      Your board is empty.{" "}
                      <button type="button" onClick={openCreate}
                        className="font-medium text-gray-700 underline-offset-2 hover:underline">
                        Create your first note
                      </button>
                    </p>
                  )}
                </div>
              ) : (
                notes.map((note) => {
                  const { x, y } = notePosition(note);
                  const card = stickyCardClasses(note.color);
                  const checklistItems = note.checklist ?? [];
                  const doneCount = checklistItems.filter((i) => i.checked).length;
                  const checkPct = checklistItems.length
                    ? Math.round((doneCount / checklistItems.length) * 100)
                    : 0;
                  const imageAtts = (note.attachments ?? []).filter((a) => isImageMime(a.mimeType));
                  const docCount = (note.attachments ?? []).length - imageAtts.length;

                  return (
                    <article
                      key={note._id}
                      data-sticky-note
                      className={`
                        group absolute w-[min(15.5rem,calc(100vw-3rem))] max-w-[248px] rounded-xl border
                        bg-gradient-to-br p-0 z-10
                        shadow-[3px_3px_0_rgba(15,23,42,0.07),0_12px_28px_rgba(15,23,42,0.06)]
                        transition-shadow hover:shadow-[3px_3px_0_rgba(15,23,42,0.10),0_16px_32px_rgba(15,23,42,0.10)]
                        ${card}
                      `}
                      style={{ left: `${x}%`, top: `${y}%` }}
                    >
                      {/* pin badge */}
                      {note.isPinned && (
                        <div className="absolute -right-1.5 -top-1.5 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 shadow">
                          <Pin className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}

                      {/* drag handle + hover actions */}
                      <div
                        className="flex cursor-grab touch-none items-center gap-1.5 rounded-t-xl border-b border-black/5 bg-black/[0.03] px-2 py-1.5 active:cursor-grabbing"
                        onPointerDown={(e) => handleGripDown(e, note)}
                        role="presentation"
                      >
                        <GripVertical className="h-4 w-4 shrink-0 text-gray-500/80" />
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          Drag
                        </span>
                        <div
                          className="ml-auto flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <button type="button" title="Edit note"
                            onClick={() => { setEditPanelNoteId(note._id); setCreatePanelOpen(false); }}
                            className="rounded-lg p-1 text-gray-500 transition hover:bg-black/10 hover:text-gray-800">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" title={note.isPinned ? "Unpin" : "Pin to top"}
                            onClick={() => handleTogglePin(note)}
                            className="rounded-lg p-1 text-gray-500 transition hover:bg-black/10 hover:text-gray-800">
                            {note.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                          </button>
                          <button type="button" title={note.isArchived ? "Restore" : "Archive"}
                            onClick={() => handleToggleArchive(note)}
                            className="rounded-lg p-1 text-gray-500 transition hover:bg-black/10 hover:text-gray-800">
                            {note.isArchived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                          </button>
                          <button type="button" title="Delete note"
                            onClick={() => handleDeleteConfirm(note._id)}
                            className="rounded-lg p-1 text-gray-500 transition hover:bg-black/10 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* clickable body */}
                      <div
                        className="cursor-pointer px-3 pb-0 pt-2 transition-colors hover:bg-black/[0.025]"
                        onClick={() => { setEditPanelNoteId(note._id); setCreatePanelOpen(false); }}
                        title="Click to edit"
                      >
                        <h3 className="text-sm font-bold leading-snug">{note.title}</h3>
                        <p className="mt-1.5 max-h-36 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed opacity-90">
                          {note.content}
                        </p>

                        {/* checklist preview */}
                        {checklistItems.length > 0 && (
                          <div className="mt-2">
                            <div className="mb-1 flex items-center gap-1.5">
                              <CheckSquare className="h-3 w-3 opacity-60" />
                              <span className="text-[10px] font-medium opacity-70">
                                {doneCount}/{checklistItems.length}
                              </span>
                            </div>
                            <div className="h-1 overflow-hidden rounded-full bg-black/10">
                              <div
                                className="h-full rounded-full bg-violet-600/70 transition-all"
                                style={{ width: `${checkPct}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* attachment previews */}
                        {(imageAtts.length > 0 || docCount > 0) && (
                          <div
                            className="mt-2 flex items-center gap-1.5 flex-wrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {imageAtts.slice(0, 3).map((att, i) => (
                              <button
                                key={att._id}
                                type="button"
                                onClick={() => setCardPreview({ attachments: note.attachments ?? [], index: i })}
                                className="h-8 w-8 shrink-0 overflow-hidden rounded-md ring-1 ring-black/10 transition hover:scale-105 hover:ring-violet-400 focus:outline-none"
                                title={att.name}
                              >
                                <img src={att.url} alt={att.name} className="h-full w-full object-cover" />
                              </button>
                            ))}
                            {imageAtts.length > 3 && (
                              <span className="text-[10px] font-medium opacity-60">
                                +{imageAtts.length - 3}
                              </span>
                            )}
                            {docCount > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const firstDoc = (note.attachments ?? []).find((a) => !isImageMime(a.mimeType));
                                  if (firstDoc) setCardPreview({ attachments: note.attachments ?? [], index: (note.attachments ?? []).indexOf(firstDoc) });
                                }}
                                className="flex items-center gap-0.5 rounded-md bg-black/10 px-1.5 py-0.5 text-[10px] font-medium transition hover:bg-black/20"
                                title="View documents"
                              >
                                <FileText className="h-2.5 w-2.5" />
                                {docCount}
                              </button>
                            )}
                          </div>
                        )}

                        {/* tags */}
                        {(note.tags ?? []).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(note.tags ?? []).map((tag) => (
                              <span
                                key={tag}
                                className="flex items-center gap-0.5 rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-medium"
                              >
                                <Tag className="h-2.5 w-2.5 opacity-60" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {note.updatedAt && (
                          <p className="mt-2 text-[10px] font-medium uppercase tracking-wide opacity-55">
                            {formatWhen(note.updatedAt)}
                          </p>
                        )}
                      </div>

                      {/* color swatches */}
                      <div
                        className="mt-3 flex items-center gap-1.5 border-t border-black/5 px-3 pb-2 pt-2"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[10px] font-medium text-gray-600/90">Color</span>
                        <div className="flex flex-wrap gap-1">
                          {STICKY_COLOR_OPTIONS.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              title={opt.label}
                              disabled={patchMut.isPending}
                              onClick={() => handleColorChange(note._id, opt.id)}
                              className={`
                                h-5 w-5 shrink-0 rounded-full transition hover:scale-110
                                focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500
                                ${opt.swatch}
                                ${(note.color ?? "lemon") === opt.id ? "ring-2 ring-violet-600 ring-offset-1" : "ring-1 ring-black/10"}
                              `}
                            />
                          ))}
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* ── edit panel backdrop ── */}
        {editPanelOpen && (
          <button
            type="button"
            className="absolute inset-0 z-[90] bg-slate-900/20 backdrop-blur-[1px] lg:hidden"
            onClick={() => setEditPanelNoteId(null)}
            aria-label="Close edit panel"
          />
        )}

        {/* ── edit panel ── */}
        <div
          className={`
            absolute right-0 top-0 z-[100] h-full w-full max-w-md
            transition-transform duration-300 ease-out
            ${editPanelOpen ? "translate-x-0" : "translate-x-full"}
          `}
        >
          {editPanelNote && (
            <EditNotePanel
              key={editPanelNote._id}
              note={editPanelNote}
              onSave={handleEditSave}
              onClose={() => setEditPanelNoteId(null)}
              isSaving={patchMut.isPending}
            />
          )}
        </div>
      </div>

      {/* ── mobile FAB ── */}
      {!showArchived && (
        <button
          type="button"
          onClick={openCreate}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-[0_10px_40px_rgba(109,40,217,0.45)] transition hover:bg-violet-700 lg:hidden"
          aria-label="New sticky note"
        >
          <Plus className="h-7 w-7" />
        </button>
      )}

      {/* ── create slide-over panel ── */}
      <div
        className={`fixed inset-0 z-[100] transition ${createPanelOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!createPanelOpen}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity ${createPanelOpen ? "opacity-100" : "opacity-0"}`}
          onClick={closeCreate}
          aria-label="Close panel"
        />
        <div
          className={`
            absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-2xl
            transition-transform duration-300 ease-out
            ${createPanelOpen ? "translate-x-0" : "translate-x-full"}
          `}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-panel-title"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 id="create-panel-title" className="text-lg font-semibold text-gray-900">
              New sticky
            </h2>
            <button type="button" onClick={closeCreate}
              className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100"
              aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleCreateSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Color</p>
              <ColorSwatches value={createColor} onChange={setCreateColor} />
            </div>
            <Input label="Title" name="title" value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="Short headline" autoComplete="off" />
            <Input label="Note" name="content" type="textarea" value={createContent}
              onChange={(e) => setCreateContent(e.target.value)}
              placeholder="Your reminder…" />
            <TagInput tags={createTags} onChange={setCreateTags} />
            <div className="mt-auto flex gap-2 border-t border-gray-100 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={closeCreate}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="flex-1" disabled={createMut.isPending}>
                {createMut.isPending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Create"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* ── delete confirm ── */}
      <DeleteConfirmDialog
        open={deleteConfirm.open}
        onConfirm={handleDeleteExecute}
        onCancel={() => setDeleteConfirm({ open: false, noteId: null })}
        isLoading={deleteMut.isPending}
      />

      {/* ── card attachment preview ── */}
      {cardPreview && (
        <FilePreviewModal
          attachments={cardPreview.attachments}
          startIndex={cardPreview.index}
          onClose={() => setCardPreview(null)}
        />
      )}
    </div>
  );
}
