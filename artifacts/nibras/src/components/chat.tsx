import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/inputs";
import { ScrollArea } from "@/components/ui/interactive";
import { useAppStore } from "@/lib/store";
import { useChatWithNuha, ChatMessageRole } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface ChatMessageWithSources {
  role: "user" | "assistant";
  content: string;
  ragSources?: string[];
  patched?: boolean;
}

export function Chat() {
  const { currentLesson, chatHistory, addChatMessage, patchCurrentLesson } = useAppStore();
  const [input, setInput] = useState("");
  const [messagesWithSources, setMessagesWithSources] = useState<ChatMessageWithSources[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = useChatWithNuha();

  useEffect(() => {
    setMessagesWithSources((prev) => {
      if (chatHistory.length < prev.length) {
        return chatHistory.map((msg) => ({ role: msg.role as "user" | "assistant", content: msg.content }));
      }
      return prev;
    });
  }, [chatHistory]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messagesWithSources, chatMutation.isPending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMsg = input.trim();
    setInput("");

    const userEntry: ChatMessageWithSources = { role: "user", content: userMsg };
    setMessagesWithSources((prev) => [...prev, userEntry]);
    addChatMessage({ role: ChatMessageRole.user, content: userMsg });

    chatMutation.mutate(
      {
        data: {
          message: userMsg,
          lessonContext: currentLesson || undefined,
          history: chatHistory,
        },
      },
      {
        onSuccess: (res) => {
          const patched = !!(res.lessonPatch && Object.keys(res.lessonPatch).length > 0);
          if (patched && res.lessonPatch) {
            patchCurrentLesson(res.lessonPatch);
          }
          const assistantEntry: ChatMessageWithSources = {
            role: "assistant",
            content: res.reply,
            ragSources: res.ragSources,
            patched,
          };
          setMessagesWithSources((prev) => [...prev, assistantEntry]);
          addChatMessage({ role: ChatMessageRole.assistant, content: res.reply });
        },
        onError: (err) => {
          console.error("Chat error:", err);
          const errorEntry: ChatMessageWithSources = {
            role: "assistant",
            content: "عذراً، حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى.",
          };
          setMessagesWithSources((prev) => [...prev, errorEntry]);
          addChatMessage({
            role: ChatMessageRole.assistant,
            content: "عذراً، حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى.",
          });
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border shadow-sm overflow-hidden flex-1">
      <div className="px-6 py-4 border-b bg-primary/5 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-serif text-lg font-bold text-primary">مساعد نهى الذكي</h3>
          <p className="text-xs text-muted-foreground">اسألني لتعديل الخطة أو اقتراح أفكار جديدة</p>
        </div>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4 h-[400px]">
        <div className="space-y-4 pb-4">
          {messagesWithSources.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                <SparklesIcon className="w-6 h-6" />
              </div>
              <p className="text-sm">كيف يمكنني مساعدتك في تحسين هذا الدرس؟</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messagesWithSources.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex flex-col gap-1",
                    msg.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "flex gap-3 max-w-[85%]",
                      msg.role === "user" ? "flex-row-reverse" : ""
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        msg.role === "user"
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-primary text-primary-foreground"
                      )}
                    >
                      {msg.role === "user" ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "px-4 py-2 rounded-2xl text-sm font-arabic leading-relaxed whitespace-pre-wrap",
                        msg.role === "user"
                          ? "bg-muted text-foreground rounded-tr-sm"
                          : "bg-primary/10 text-foreground border border-primary/10 rounded-tl-sm"
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>

                  {msg.role === "assistant" && msg.patched && (
                    <div className="mr-11 max-w-[80%]">
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
                        <CheckIcon className="w-3 h-3" />
                        تم تحديث الخطة تلقائياً
                      </span>
                    </div>
                  )}

                  {msg.role === "assistant" && msg.ragSources && msg.ragSources.length > 0 && (
                    <div className="mr-11 max-w-[80%]">
                      <RagSourcesBadge sources={msg.ragSources} />
                    </div>
                  )}
                </motion.div>
              ))}

              {chatMutation.isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 max-w-[85%]"
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-primary/10 border border-primary/10 flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-muted/30">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب رسالتك لنهى هنا..."
            className="flex-1 bg-background"
            disabled={chatMutation.isPending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || chatMutation.isPending}
            className="shrink-0 bg-primary hover:bg-primary/90"
          >
            {chatMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4 rotate-180" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

function RagSourcesBadge({ sources }: { sources: string[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
      >
        <BookOpen className="w-3 h-3" />
        <span>{expanded ? "إخفاء المصادر" : `${sources.length} مصادر تعليمية مُستخدمة`}</span>
      </button>
      {expanded && (
        <motion.ul
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-1.5 space-y-1 pr-2 border-r-2 border-primary/20"
        >
          {sources.map((src, i) => (
            <li key={i} className="text-xs text-muted-foreground">
              • {src}
            </li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}


function SparklesIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
