
import { useAuth } from "@/lib/auth-context"; // To get the current user
import {
    addOrUpdateUser,
    createConversation as createConversationService,
    getConversations,
    onMessagesSnapshot,
    sendMessage,
} from "@/lib/chat-service";
import type { ChatConversation, ChatState } from "@/types/chat";
import React from "react";
import { create } from "zustand";

type ChatComponentState = {
  state: ChatState;
  activeConversation?: string;
};

interface ChatStore {
  // State
  chatState: ChatComponentState;
  conversations: ChatConversation[];
  newMessage: string;
  unsubscribeMessages: () => void;
  isNewChatDialogOpen: boolean;
  currentUser: string | undefined;

  // Actions
  initializeConversations: (userId: string) => Promise<void>;
  setChatState: (state: ChatComponentState) => void;
  setConversations: (conversations: ChatConversation[]) => void;
  setNewMessage: (message: string) => void;
  handleSendMessage: () => Promise<void>;
  setCurrentUser: (userId: string | undefined) => void;
  openConversation: (conversationId: string) => void;
  goBack: () => void;
  toggleExpanded: () => void;
  openNewChatDialog: () => void;
  closeNewChatDialog: () => void;
  createConversation: (otherUserId: string) => Promise<void>;
}

const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  chatState: {
    state: "collapsed",
  },
  conversations: [],
  newMessage: "",
  unsubscribeMessages: () => {},
  isNewChatDialogOpen: false,
  currentUser: undefined,

  // Actions
  initializeConversations: async (userId) => {
    const conversations = await getConversations(userId);
    set({ conversations, currentUser: userId });
  },

  setChatState: (chatState) => set({ chatState }),

  setConversations: (conversations) => set({ conversations }),

  setNewMessage: (newMessage) => set({ newMessage }),

  setCurrentUser: (userId) => set({ currentUser: userId }),

  handleSendMessage: async () => {
    const { newMessage, chatState, currentUser } = get();
    if (!newMessage.trim() || !chatState.activeConversation || !currentUser) return;

    await sendMessage(
      chatState.activeConversation,
      newMessage.trim(),
      currentUser
    );

    set({ newMessage: "" });
  },

  openConversation: (conversationId) => {
    const { unsubscribeMessages } = get();
    unsubscribeMessages();

    const unsubscribe = onMessagesSnapshot(conversationId, get().currentUser || '', (messages) => {
      const { conversations } = get();
      const updatedConversations = conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, messages, unreadCount: 0 } : conv
      );
      set({ conversations: updatedConversations });
    });

    // Mark messages as read when opening conversation
    import('@/lib/chat-service').then(({ markConversationAsRead }) => {
      markConversationAsRead(conversationId).catch(console.error);
    });

    set({
      chatState: { state: "conversation", activeConversation: conversationId },
      unsubscribeMessages: unsubscribe,
    });
  },

  goBack: () => {
    const { chatState, unsubscribeMessages } = get();
    if (chatState.state === "conversation") {
      unsubscribeMessages();
      set({ chatState: { state: "expanded" }, unsubscribeMessages: () => {} });
    } else {
      set({ chatState: { state: "collapsed" } });
    }
  },

  toggleExpanded: () => {
    const { chatState } = get();
    set({
      chatState: {
        state: chatState.state === "collapsed" ? "expanded" : "collapsed",
      },
    });
  },

  openNewChatDialog: () => set({ isNewChatDialogOpen: true }),
  closeNewChatDialog: () => set({ isNewChatDialogOpen: false }),

  createConversation: async (otherUserId: string) => {
    const { currentUser } = get();
    if (!currentUser) return;

    const conversationId = await createConversationService(currentUser, otherUserId);
    get().openConversation(conversationId);
    get().closeNewChatDialog();
    // Also refresh conversations list
    get().initializeConversations(currentUser);
  },
}));

// Hook with computed values using selectors
export const useChatState = () => {
  const store = useChatStore();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user) {
      // Update user data in Firestore and initialize conversations
      Promise.all([
        store.initializeConversations(user.uid),
        addOrUpdateUser(user)
      ]).catch(console.error);
    }
  }, [user]);

  const totalUnreadCount = store.conversations.reduce(
    (total, conv) => total + (conv.unreadCount || 0),
    0
  );

  const activeConversation = store.conversations.find(
    (conv) => conv.id === store.chatState.activeConversation
  );

  return { ...store, totalUnreadCount, activeConversation };
};

