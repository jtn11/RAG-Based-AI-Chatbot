import { Sparkles, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { EmptyState } from "./empty-state";
import { useChat } from "../context/chatContext";

interface chatAreaProps {
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
}

export const ChatArea = ({
  isTyping,
  messagesEndRef,
  setInputValue,
}: chatAreaProps) => {
  const { currentChatId, messages } = useChat();

  return (
    <div className="flex-1 overflow-y-auto">
      {!currentChatId && messages.length === 0 ? (
        // Empty State
        <EmptyState setInputValue={setInputValue} />
      ) : (
        // Messages
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex items-start space-x-3 max-w-[85%] md:max-w-[80%] ${
                  message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
                }`}
              >
                <div
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.sender === "bot"
                      ? "bg-linear-to-br from-blue-500 to-purple-600 shadow-xs"
                      : "bg-gray-600"
                  }`}
                >
                  {message.sender === "bot" ? (
                    <Sparkles className="h-5 w-5 text-white" />
                  ) : (
                    <User className="h-5 w-5 text-white" />
                  )}
                </div>
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed overflow-hidden ${
                    message.sender === "bot"
                      ? "bg-white border text-gray-900 border-gray-200 shadow-xs"
                      : "bg-gray-600 text-white whitespace-pre-wrap"
                  }`}
                >
                  {message.sender === "bot" ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                          h1: ({ children }) => <h1 className="text-base font-bold mt-4 mb-2 text-gray-900">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-sm font-bold mt-3 mb-1.5 text-gray-900">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-gray-900">{children}</h3>,
                          ul: ({ children }) => <ul className="list-disc pl-5 mb-2.5 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-5 mb-2.5 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-blue-500 pl-3 py-1 my-2 bg-blue-50/50 italic text-gray-700 rounded-r">
                              {children}
                            </blockquote>
                          ),
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-3 border border-gray-200 rounded-lg shadow-2xs">
                              <table className="min-w-full divide-y divide-gray-200 text-xs">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
                          tbody: ({ children }) => <tbody className="divide-y divide-gray-100 bg-white">{children}</tbody>,
                          tr: ({ children }) => <tr className="hover:bg-gray-50/70 transition-colors">{children}</tr>,
                          th: ({ children }) => (
                            <th className="px-3 py-2 text-left font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 text-[11px]">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="px-3 py-2 text-gray-800 align-top leading-normal">
                              {children}
                            </td>
                          ),
                          code: ({ className, children, ...props }) => {
                            const isBlock = Boolean(className) || (typeof children === "string" && children.includes("\n"));
                            return isBlock ? (
                              <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto font-mono text-xs my-2">
                                <code {...props}>{children}</code>
                              </pre>
                            ) : (
                              <code className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded font-mono text-xs font-medium" {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {message.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    message.text
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="bg-white border text-black border-gray-200 px-4 py-3 rounded-2xl">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};
