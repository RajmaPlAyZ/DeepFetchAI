import type { ChatConversation, ChatMessage, ChatUser } from "@/types/chat";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    limit,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where,
} from "firebase/firestore";
import app from "./firebase";

const db = getFirestore(app);

// Function to add or update a user in Firestore
export const addOrUpdateUser = async (user: {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}) => {
  const userDoc = doc(db, "users", user.uid);
  await setDoc(userDoc, {
    id: user.uid,
    name: user.displayName || "Anonymous",
    username: user.email?.split("@")[0] || "user",
    avatar: user.photoURL || "/placeholder-user.jpg",
    isOnline: true,
    lastSeen: Timestamp.now(),
  }, { merge: true });
};

// Function to get user data
const getUserData = async (userId: string): Promise<ChatUser> => {
  const userDoc = await getDoc(doc(db, "users", userId));
  if (!userDoc.exists()) {
    return {
      id: userId,
      name: "Unknown User",
      username: "unknown",
      avatar: "/placeholder-user.jpg",
      isOnline: false,
    };
  }
  return userDoc.data() as ChatUser;
};

const getConversationDoc = (conversationId: string) =>
  doc(db, "conversations", conversationId);

const getMessagesCollection = (conversationId: string) =>
  collection(db, "conversations", conversationId, "messages");

export const getConversations = async (userId: string): Promise<ChatConversation[]> => {
  const q = query(
    collection(db, "conversations"),
    where("participants", "array-contains", userId)
  );
  const querySnapshot = await getDocs(q);
  const conversations: ChatConversation[] = [];

  for (const doc of querySnapshot.docs) {
    const convData = doc.data();
    const participantPromises = convData.participants.map((id: string) => getUserData(id));
    const participants = await Promise.all(participantPromises);

    // Get the last message
    const messagesQuery = query(
      getMessagesCollection(doc.id),
      orderBy("timestamp", "desc"),
      limit(1)
    );
    const lastMessageSnapshot = await getDocs(messagesQuery);
    const lastMessageDoc = lastMessageSnapshot.docs[0];
    
    const lastMessage = lastMessageDoc ? {
      id: lastMessageDoc.id,
      ...lastMessageDoc.data(),
      timestamp: (lastMessageDoc.data().timestamp as Timestamp).toDate().toISOString(),
    } as ChatMessage : {
      id: 'placeholder',
      content: 'No messages yet',
      timestamp: new Date().toISOString(),
      senderId: '',
      isFromCurrentUser: false,
    };

    conversations.push({
      id: doc.id,
      participants,
      unreadCount: convData.unreadCount || 0,
      lastMessage,
      messages: [],
    });
  }

  return conversations;
};

export const onMessagesSnapshot = (
  conversationId: string,
  currentUserId: string,
  callback: (messages: ChatMessage[]) => void
) => {
  const q = query(
    getMessagesCollection(conversationId),
    orderBy("timestamp", "asc")
  );

  return onSnapshot(q, (querySnapshot) => {
    const messages: ChatMessage[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        content: data.content,
        timestamp: (data.timestamp as Timestamp).toDate().toISOString(),
        senderId: data.senderId,
        isFromCurrentUser: data.senderId === currentUserId
      });
    });
    callback(messages);
  });
};

export const sendMessage = async (
  conversationId: string,
  content: string,
  senderId: string
): Promise<void> => {
  const message = {
    content,
    senderId,
    timestamp: Timestamp.now(),
  };

  // Add the message to the messages subcollection
  await addDoc(getMessagesCollection(conversationId), message);

  // Get the conversation to check participants
  const conversationDoc = await getDoc(getConversationDoc(conversationId));
  const conversationData = conversationDoc.data();
  
  if (!conversationData) throw new Error("Conversation not found");

  // Update the lastMessage and increment unread count for other participants
  await updateDoc(getConversationDoc(conversationId), {
    lastMessage: {
      ...message,
      timestamp: message.timestamp.toDate().toISOString(),
    },
    lastUpdated: Timestamp.now(),
    // Increment unread count for all participants except sender
    unreadCount: (conversationData.unreadCount || 0) + 1
  });
};

export const createConversation = async (userId1: string, userId2: string): Promise<string> => {
  const participants = [userId1, userId2].sort((a, b) => a.localeCompare(b));
  const q = query(
    collection(db, "conversations"),
    where("participants", "==", participants)
  );

  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].id;
  }

  const newConversation = await addDoc(collection(db, "conversations"), {
    participants,
    createdAt: Timestamp.now(),
    lastUpdated: Timestamp.now(),
    unreadCount: 0,
  });

  return newConversation.id;
};

export const getUsers = async (): Promise<ChatUser[]> => {
  const usersCollection = collection(db, "users");
  const usersSnapshot = await getDocs(usersCollection);
  return usersSnapshot.docs.map(doc => doc.data() as ChatUser);
};

export const markConversationAsRead = async (conversationId: string) => {
  await updateDoc(getConversationDoc(conversationId), {
    unreadCount: 0
  });
};