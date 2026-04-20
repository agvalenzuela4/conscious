import React, { useState } from "react";
import { useAppContext, Mood, JournalEntry } from "../context/AppContext";
import { generateReflection, continueJournalConversation } from "../lib/gemini";
import { motion } from "motion/react";
import { Send, Loader2, MessageCircle } from "lucide-react";

const JournalEntryCard: React.FC<{ entry: JournalEntry; moods: { value: Mood; emoji: string; label: string }[]; updateJournalEntry: any }> = ({ entry, moods, updateJournalEntry }) => {
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setIsReplying(true);

    const newUserMsg = { role: "user" as const, text: replyText };
    const currentThread = entry.thread || [];
    const newThread = [...currentThread, newUserMsg];
    
    updateJournalEntry(entry.id, { thread: newThread });
    setReplyText("");

    try {
      const response = await continueJournalConversation(
        entry.text,
        entry.mood,
        entry.aiReflection,
        currentThread,
        newUserMsg.text
      );
      
      updateJournalEntry(entry.id, { 
        thread: [...newThread, { role: "model" as const, text: response }] 
      });
    } catch (error) {
      console.error("Failed to continue conversation:", error);
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">
          {moods.find((m) => m.value === entry.mood)?.emoji}
        </span>
        <span className="text-sm text-stone-500 font-medium">
          {new Date(entry.date).toLocaleDateString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
      <p className="text-stone-800 leading-relaxed mb-6">
        {entry.text}
      </p>

      {entry.aiReflection && (
        <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100/50 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-emerald-200 flex items-center justify-center">
              <span className="text-[10px]">✨</span>
            </div>
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Coach Reflection
            </span>
          </div>
          <p className="text-sm text-emerald-900 leading-relaxed">
            {entry.aiReflection}
          </p>

          {/* Conversation Thread */}
          {entry.thread && entry.thread.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-emerald-100/50">
              {entry.thread.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-stone-900 text-white rounded-tr-sm' 
                      : 'bg-white border border-emerald-100 text-emerald-900 rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reply Area */}
          {!showReplyInput ? (
            <button 
              onClick={() => setShowReplyInput(true)}
              className="mt-2 text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 transition-colors"
            >
              <MessageCircle size={14} /> Continue conversation
            </button>
          ) : (
            <div className="mt-4 flex gap-2 items-end pt-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Reply to coach..."
                className="flex-1 min-h-[44px] h-[44px] bg-white border border-emerald-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-200 focus:outline-none resize-none text-emerald-900 placeholder:text-emerald-600/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleReply();
                  }
                }}
              />
              <button
                onClick={handleReply}
                disabled={isReplying || !replyText.trim()}
                className="h-[44px] w-[44px] shrink-0 bg-emerald-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50 transition-colors"
              >
                {isReplying ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const Mind: React.FC = () => {
  const { journalEntries, addJournalEntry, updateJournalEntry } = useAppContext();
  const [text, setText] = useState("");
  const [mood, setMood] = useState<Mood>("okay");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const moods: { value: Mood; emoji: string; label: string }[] = [
    { value: "great", emoji: "✨", label: "Great" },
    { value: "good", emoji: "😊", label: "Good" },
    { value: "okay", emoji: "😐", label: "Okay" },
    { value: "tired", emoji: "🥱", label: "Tired" },
    { value: "stressed", emoji: "😫", label: "Stressed" },
    { value: "anxious", emoji: "😰", label: "Anxious" },
  ];

  const prompts = [
    "Tell me about what you did today...",
    "Did you have a conversation that made you smile today?",
    "What was the funniest thing that happened to you today?",
    "What are three things you are grateful for today?",
    "What is something you learned about yourself recently?",
  ];

  const handlePromptClick = (prompt: string) => {
    setText((prev) => (prev ? `${prev}\n\n${prompt} ` : `${prompt} `));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSubmitting(true);
    try {
      const reflection = await generateReflection(text, mood);
      addJournalEntry({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        text,
        mood,
        aiReflection: reflection,
      });
      setText("");
    } catch (error) {
      console.error("Failed to generate reflection:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 max-w-md mx-auto min-h-screen pb-24"
    >
      <header className="mb-8">
        <h1 className="text-3xl font-serif font-medium text-stone-900">Mind</h1>
        <p className="text-stone-500 mt-2">
          Reflect on your day and process your emotions.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 mb-8"
      >
        <div className="mb-6">
          <label className="block text-sm font-medium text-stone-700 mb-3">
            How are you feeling?
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {moods.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(m.value)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl min-w-[72px] transition-all ${
                  mood === m.value
                    ? "bg-emerald-50 border-2 border-emerald-200 text-emerald-800"
                    : "bg-stone-50 border-2 border-transparent text-stone-600 hover:bg-stone-100"
                }`}
              >
                <span className="text-2xl mb-1">{m.emoji}</span>
                <span className="text-[10px] font-medium uppercase tracking-wider">
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-stone-700 mb-2 flex items-center justify-between">
              <span>Need some inspiration?</span>
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {prompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePromptClick(prompt)}
                  className="whitespace-nowrap px-4 py-2 bg-stone-50 hover:bg-emerald-50 text-stone-600 hover:text-emerald-700 border border-stone-200 hover:border-emerald-200 rounded-full text-xs transition-colors shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind today?"
            className="w-full h-32 p-4 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-200 resize-none text-stone-800 placeholder:text-stone-400"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !text.trim()}
          className="w-full bg-stone-900 text-white rounded-2xl py-4 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-800 transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Reflecting...
            </>
          ) : (
            <>
              <Send size={18} /> Save Entry
            </>
          )}
        </button>
      </form>

      <div className="space-y-6">
        <h2 className="text-lg font-medium text-stone-900 px-2">
          Recent Entries
        </h2>
        {journalEntries.length === 0 ? (
          <p className="text-stone-500 text-center py-8">
            No entries yet. Start journaling above.
          </p>
        ) : (
          journalEntries.map((entry) => (
            <JournalEntryCard 
              key={entry.id} 
              entry={entry} 
              moods={moods} 
              updateJournalEntry={updateJournalEntry} 
            />
          ))
        )}
      </div>
    </motion.div>
  );
};
