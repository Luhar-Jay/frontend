export interface ChatUser {
  _id: string;
  name: string;
  profileImage: string | null;
}

export interface ReplyToMessage {
  _id: string;
  /** null when the original message was soft-deleted for this viewer */
  message: string | null;
  sender: { _id: string; name: string };
  attachments?: ChatAttachment[];
}

export interface ChatAttachment {
  url: string;
  name: string;
  mimeType: string;
  size: number;
}

export interface ChatReaction {
  emoji: string;
  user: ChatUser;
}

export interface ChatMessage {
  _id: string;
  sender: ChatUser;
  receiver?: ChatUser | null;
  group?: { _id: string; name: string } | null;
  message: string;
  isRead: boolean;
  isEdited?: boolean;
  isForwarded?: boolean;
  forwardedFrom?: string | null;
  attachments?: ChatAttachment[];
  replyTo?: ReplyToMessage | null;
  reactions?: ChatReaction[];
  mentions?: ChatUser[];
  readBy?: ChatUser[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatGroup {
  _id: string;
  name: string;
  description?: string;
  createdBy: ChatUser;
  members: ChatUser[];
  admins: ChatUser[];
  groupImage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ChatMessagesResponse {
  success: boolean;
  data: ChatMessage[];
  pagination: ChatPagination;
}

export interface OnlineUsersResponse {
  success: boolean;
  data: string[];
}

export interface ChatGroupsResponse {
  success: boolean;
  data: ChatGroup[];
}

export interface PinnedMessage extends ChatMessage {
  pinnedAt: string;
  pinnedBy: ChatUser;
}

export interface MessageBookmark {
  _id: string;
  note: string;
  savedAt: string;
  message: ChatMessage;
}

export interface ScheduledMessage {
  _id: string;
  sender: string;
  receiver?: ChatUser | null;
  group?: { _id: string; name: string } | null;
  message: string;
  attachments?: ChatAttachment[];
  scheduledAt: string;
  sent: boolean;
  createdAt: string;
}

export interface GifResult {
  id: string;
  title: string;
  preview: string;
  url: string;
  dims: [number, number];
}
