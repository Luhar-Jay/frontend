import type { StickyColorId } from "../utils/stickyNoteTheme";

export interface NoteAttachment {
  _id: string;
  url: string;
  publicId: string;
  name: string;
  mimeType: string;
  size: number;
}

export interface NoteChecklistItem {
  _id: string;
  text: string;
  checked: boolean;
}

export interface StickyNote {
  _id: string;
  user: string;
  title: string;
  content: string;
  color?: StickyColorId;
  positionX?: number;
  positionY?: number;
  isArchived?: boolean;
  isPinned?: boolean;
  tags?: string[];
  attachments?: NoteAttachment[];
  checklist?: NoteChecklistItem[];
  createdAt?: string;
  updatedAt?: string;
}

export type PatchNoteBody = {
  title?: string;
  content?: string;
  color?: StickyColorId;
  positionX?: number;
  positionY?: number;
  isArchived?: boolean;
  isPinned?: boolean;
  tags?: string[];
  checklist?: Array<{ text: string; checked: boolean }>;
};

export interface NotesListResponse {
  success: boolean;
  message: string;
  notes: StickyNote[];
}

export interface CreateNoteResponse {
  success: boolean;
  message: string;
  note: StickyNote;
}

export interface UpdateNoteResponse {
  success: boolean;
  message: string;
  note: StickyNote;
}

export interface DeleteNoteResponse {
  success: boolean;
  message: string;
}
