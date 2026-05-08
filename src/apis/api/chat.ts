import { useQuery } from "@tanstack/react-query";
import { api, uploadFormData } from "../apiService";
import type {
  ChatAttachment,
  ChatGroup,
  ChatGroupsResponse,
  ChatMessagesResponse,
  GifResult,
  MessageBookmark,
  OnlineUsersResponse,
  PinnedMessage,
  ScheduledMessage,
} from "../../types/chat.types";
import type { User } from "../../types/user.types";

export const useChatMessages = (receiverId: string, page = 1) => {
  return useQuery({
    queryKey: ["chatMessages", receiverId, page],
    enabled: !!receiverId,
    queryFn: async () => {
      const res = await api.get<ChatMessagesResponse>(`/chat/${receiverId}`, {
        auth: true,
        query: { page, limit: 50 },
      });
      return res;
    },
  });
};

export const useGroupMessages = (groupId: string, page = 1) => {
  return useQuery({
    queryKey: ["groupMessages", groupId, page],
    enabled: !!groupId,
    queryFn: async () => {
      const res = await api.get<ChatMessagesResponse>(`/chat/groups/${groupId}/messages`, {
        auth: true,
        query: { page, limit: 50 },
      });
      return res;
    },
  });
};

export const useChatUsers = (orgContext?: string) => {
  return useQuery({
    queryKey: ["chatUsers", orgContext],
    queryFn: async () => {
      const res = await api.get<{ users: User[] }>("/chat/users", {
        auth: true,
        query: orgContext ? { orgContext } : undefined,
      });
      return res.users;
    },
  });
};

export const useChatGroups = () => {
  return useQuery({
    queryKey: ["chatGroups"],
    queryFn: async () => {
      const res = await api.get<ChatGroupsResponse>("/chat/groups", { auth: true });
      return res.data;
    },
  });
};

export const useDmPinnedMessages = (receiverId: string) => {
  return useQuery({
    queryKey: ["dmPinned", receiverId],
    enabled: !!receiverId,
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: PinnedMessage[] }>(
        `/chat/${receiverId}/pinned`,
        { auth: true }
      );
      return res.data;
    },
  });
};

export const useGroupPinnedMessages = (groupId: string) => {
  return useQuery({
    queryKey: ["groupPinned", groupId],
    enabled: !!groupId,
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: PinnedMessage[] }>(
        `/chat/groups/${groupId}/pinned`,
        { auth: true }
      );
      return res.data;
    },
  });
};

export const useBookmarks = () => {
  return useQuery({
    queryKey: ["chatBookmarks"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: MessageBookmark[] }>("/chat/bookmarks", {
        auth: true,
      });
      return res.data;
    },
  });
};

export const useScheduledMessages = () => {
  return useQuery({
    queryKey: ["scheduledMessages"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: ScheduledMessage[] }>(
        "/chat/scheduled",
        { auth: true }
      );
      return res.data;
    },
  });
};

export const useGifSearch = (query: string) => {
  return useQuery({
    queryKey: ["gifs", query],
    enabled: true,
    staleTime: 60_000,
    queryFn: async () => {
      const endpoint = query.trim() ? "/chat/gifs" : "/chat/gifs/trending";
      const res = await api.get<{ success: boolean; data: GifResult[] }>(endpoint, {
        auth: true,
        query: query.trim() ? { q: query.trim() } : undefined,
      });
      return res.data;
    },
  });
};

export const createGroupApi = (payload: {
  name: string;
  description?: string;
  memberIds: string[];
  groupImage?: string | null;
}) => api.post<{ success: boolean; data: ChatGroup }>("/chat/groups", payload, { auth: true });

export const updateGroupApi = (
  groupId: string,
  payload: {
    name?: string;
    description?: string;
    groupImage?: string | null;
    addMembers?: string[];
    removeMembers?: string[];
  }
) =>
  api.patch<{ success: boolean; data: ChatGroup }>(`/chat/groups/${groupId}`, payload, {
    auth: true,
  });

export const deleteGroupApi = (groupId: string) =>
  api.del<{ success: boolean }>(`/chat/groups/${groupId}`, { auth: true });

export const leaveGroupApi = (groupId: string) =>
  api.post<{ success: boolean }>(`/chat/groups/${groupId}/leave`, {}, { auth: true });

export const clearGroupChatApi = (groupId: string) =>
  api.del<{ success: boolean }>(`/chat/groups/${groupId}/clear`, { auth: true });

export const deleteMessageApi = (messageId: string, deleteFor: "me" | "everyone") =>
  api.del<{ success: boolean }>(`/chat/message/${messageId}`, {
    auth: true,
    query: { deleteFor },
  });

export const uploadChatFileApi = (
  file: File
): Promise<{ success: boolean; data: ChatAttachment }> => {
  const formData = new FormData();
  formData.append("file", file);
  return uploadFormData("POST", "/chat/upload", formData, { auth: true });
};

export const clearChatApi = (otherUserId: string) =>
  api.del<{ success: boolean }>(`/chat/clear/${otherUserId}`, { auth: true });

export const editMessageApi = (messageId: string, message: string) =>
  api.patch<{ success: boolean; data: import("../../types/chat.types").ChatMessage }>(
    `/chat/message/${messageId}`,
    { message },
    { auth: true }
  );

export const toggleReactionApi = (messageId: string, emoji: string) =>
  api.post<{
    success: boolean;
    data: { reactions: import("../../types/chat.types").ChatReaction[] };
  }>(`/chat/message/${messageId}/reaction`, { emoji }, { auth: true });

export const pinMessageApi = (messageId: string) =>
  api.post<{ success: boolean }>(`/chat/message/${messageId}/pin`, {}, { auth: true });

export const unpinMessageApi = (messageId: string) =>
  api.del<{ success: boolean }>(`/chat/message/${messageId}/pin`, { auth: true });

export const bookmarkMessageApi = (messageId: string, note?: string) =>
  api.post<{ success: boolean }>(`/chat/message/${messageId}/bookmark`, { note }, { auth: true });

export const unbookmarkMessageApi = (messageId: string) =>
  api.del<{ success: boolean }>(`/chat/message/${messageId}/bookmark`, { auth: true });

export const forwardMessageApi = (
  messageId: string,
  payload: { receiverId?: string; groupId?: string }
) =>
  api.post<{ success: boolean; data: import("../../types/chat.types").ChatMessage }>(
    `/chat/message/${messageId}/forward`,
    payload,
    { auth: true }
  );

export const searchMessagesApi = (params: {
  q: string;
  receiverId?: string;
  groupId?: string;
  sender?: string;
  from?: string;
  to?: string;
  page?: number;
}) =>
  api.get<{ success: boolean; data: import("../../types/chat.types").ChatMessage[]; pagination: import("../../types/chat.types").ChatPagination }>(
    "/chat/search",
    { auth: true, query: params as Record<string, string | number> }
  );

export const createScheduledMessageApi = (payload: {
  receiverId?: string;
  groupId?: string;
  message: string;
  attachments?: import("../../types/chat.types").ChatAttachment[];
  scheduledAt: string;
}) => api.post<{ success: boolean; data: ScheduledMessage }>("/chat/scheduled", payload, { auth: true });

export const deleteScheduledMessageApi = (id: string) =>
  api.del<{ success: boolean }>(`/chat/scheduled/${id}`, { auth: true });

export const markGroupMessagesReadApi = (groupId: string) =>
  api.post<{ success: boolean }>(`/chat/groups/${groupId}/messages/read`, {}, { auth: true });

export const useOnlineUsers = () => {
  return useQuery({
    queryKey: ["onlineUsers"],
    queryFn: async () => {
      const res = await api.get<OnlineUsersResponse>("/chat/online", {
        auth: true,
      });
      return res.data;
    },
    refetchInterval: 30000,
  });
};
