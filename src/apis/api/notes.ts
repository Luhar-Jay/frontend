import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../apiService";
import { apiPath, buildPath } from "../apiPath";
import type {
  CreateNoteResponse,
  DeleteNoteResponse,
  NotesListResponse,
  PatchNoteBody,
  UpdateNoteResponse,
} from "../../types/notes.types";

export const notesQueryKey = ["notes"] as const;

export function useMyNotes(archived = false) {
  return useQuery({
    queryKey: [...notesQueryKey, { archived }],
    queryFn: () =>
      api.get<NotesListResponse>(apiPath.notes.list, {
        auth: true,
        query: archived ? { archived: "true" } : {},
      }),
  });
}

export type CreateNotePayload = {
  title: string;
  content: string;
  color?: string;
  positionX?: number;
  positionY?: number;
  tags?: string[];
};

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["createNote"],
    mutationFn: (body: CreateNotePayload) =>
      api.post<CreateNoteResponse>(apiPath.notes.create, body, { auth: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notesQueryKey });
    },
  });
}

export function usePatchNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["patchNote"],
    mutationFn: ({ id, body }: { id: string; body: PatchNoteBody }) =>
      api.patch<UpdateNoteResponse>(`${apiPath.notes.byId}${id}`, body, {
        auth: true,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notesQueryKey });
    },
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["deleteNote"],
    mutationFn: (id: string) =>
      api.del<DeleteNoteResponse>(`${apiPath.notes.byId}${id}`, { auth: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notesQueryKey });
    },
  });
}

export function useUploadNoteAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["uploadNoteAttachment"],
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const form = new FormData();
      form.append("file", file);
      return api.upload<UpdateNoteResponse>(
        "POST",
        buildPath(apiPath.notes.attachments, { id }),
        form,
        { auth: true }
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: notesQueryKey }),
  });
}

export function useDeleteNoteAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["deleteNoteAttachment"],
    mutationFn: ({ id, attachmentId }: { id: string; attachmentId: string }) =>
      api.del<UpdateNoteResponse>(
        buildPath(apiPath.notes.attachmentById, { id, attachmentId }),
        { auth: true }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: notesQueryKey }),
  });
}

export type BulkNoteAction = "archive" | "unarchive" | "delete" | "color";

export function useBulkNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["bulkNotes"],
    mutationFn: (payload: { ids: string[]; action: BulkNoteAction; color?: string }) =>
      api.patch<{ success: boolean; message: string; affected: number }>(
        apiPath.notes.bulk,
        payload,
        { auth: true }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notesQueryKey });
    },
  });
}
