"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { ChatMeta, Message } from "../types/chat-type";
import { useAuth } from "./authcontext";

interface ChatContextTypes {
  chats: ChatMeta[];
  currentChatId: string | null;
  messages: Message[];
  setCurrentChatId: (id: string | null) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  createNewChat: () => void;
  refreshChats: () => Promise<void>;
  loadMessages: (chatId: string) => Promise<void>;
  deleteChat: (chatId: string) => void;
  isRagActive: boolean;
  activeDocumentName: string;
}

const ChatContext = createContext<ChatContextTypes | undefined>(undefined);

export const ChatContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { userid } = useAuth();

  const [chats, setChats] = useState<ChatMeta[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRagActive, setIsRagActive] = useState<boolean>(false);
  const [activeDocumentName, setActiveDocumentName] = useState<string>("");

  const refreshChats = async () => {
    if (!userid) {
      return;
    }
    const res = await fetch(`/api/chat/${userid}`);
    const data = await res.json();
    console.log("Chats from /api/chat", data.chats);
    setChats(data.chats || []);
  };

  const loadMessages = async (chatId: string) => {
    const res = await fetch(`/api/messages/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userid, chatId }),
    });
    const data = await res.json();
    console.log("Messages from /api/messages", data.messages);
    setMessages(data.messages || []);
    setIsRagActive(data.isRagActive);
    setActiveDocumentName(data.activeDocumentName || "");
  };

  const createNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setIsRagActive(false);
    setActiveDocumentName("");
  };

  const deleteChat = async (chatId: string) => {
    if (!userid) return;

    await fetch(`/api/chat/deleteChat`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userid, chatId }),
    });

    if (currentChatId === chatId) {
      setCurrentChatId(null);
      setMessages([]);
      setIsRagActive(false);
      setActiveDocumentName("");
    }

    refreshChats();
  };

  useEffect(() => {
    if (!userid) return;
    refreshChats();
  }, [userid, currentChatId]);

  useEffect(() => {
    if (!currentChatId) {
      setMessages([]);
      return;
    }
    loadMessages(currentChatId);
  }, [currentChatId]);

  return (
    <ChatContext.Provider
      value={{
        chats,
        currentChatId,
        messages,
        setCurrentChatId,
        setMessages,
        refreshChats,
        loadMessages,
        createNewChat,
        deleteChat,
        isRagActive,
        activeDocumentName,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatContextProvider");
  }
  return context;
};
