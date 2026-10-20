"use client";
import { useState, useRef, useEffect } from "react";
import { SideBar } from "./sidebar";
import { ChatArea } from "./chat-area";
import { InputArea } from "./input-area";
import { TopBar } from "./top-bar";
import { ChatMeta, Message } from "../types/chat-type";
import { useAuth } from "../context/authcontext";
import { useChat } from "../context/chatContext";

export default function Dashboard() {
  const [inputValue, setInputValue] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { userid } = useAuth();
  const { currentChatId, setCurrentChatId, setMessages, messages } = useChat();

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentChatId]);

  const handleSend = async (): Promise<void> => {
    if (!inputValue.trim()) return;

    const messageText = inputValue;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: "user",
      createdAt: new Date(),
    };

    // Update chat with user message
    setMessages((prev) => [...prev, userMessage]);

    setInputValue("");
    setIsTyping(true);

    // Simulate bot response

    console.log({
      userid,
      chatId: currentChatId,
      message: messageText,
    });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userid,
          chatId: currentChatId,
          message: messageText,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get response from server");
      }

      const data = await res.json();
      console.log("This is the data after /api/chat", data);
      if (data.chatId) {
        setCurrentChatId(data.chatId);
      }

      const botMessage: Message = {
        id: Date.now().toString(),
        text: data.reply || "No response received.",
        sender: "bot",
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      console.error("Send error:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text:
          error?.message ||
          "Could not get a response. Please ensure the backend is running.",
        sender: "bot",
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {sidebarOpen && (
        <SideBar
          sidebarOpen={sidebarOpen}
          setPdfUploaded={setPdfUploaded}
          pdfUploaded={pdfUploaded}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <TopBar setSidebarOpen={() => setSidebarOpen(!sidebarOpen)} />

        {/* Messages Area */}
        <ChatArea
          isTyping={isTyping}
          messagesEndRef={messagesEndRef}
          setInputValue={setInputValue}
        />

        {/* Input Area */}
        <InputArea
          inputRef={inputRef}
          inputValue={inputValue}
          setInputValue={setInputValue}
          handleSend={handleSend}
          handleKeyPress={handleKeyPress}
        />
      </div>
    </div>
  );
}
