import React, { useState, useRef, useEffect } from "react";
import { useAppContext, Mood } from "../context/AppContext";
import { generateMeditation, generateMeditationAudio } from "../lib/gemini";
import { motion } from "motion/react";
import { Wind, Loader2, Play, Pause, Sparkles, Music, VolumeX } from "lucide-react";

export const Breathe: React.FC = () => {
  const { journalEntries, addMeditation, meditations } = useAppContext();
  const [intention, setIntention] = useState("");
  const [duration, setDuration] = useState(5);
  const [script, setScript] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMusicEnabled, setIsMusicEnabled] = useState(true);
  const [audioChunks, setAudioChunks] = useState<string[]>([]);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodesRef = useRef<AudioBufferSourceNode[]>([]);
  const AMBIENT_MUSIC_URL = "https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg";

  const recentJournal =
    journalEntries.length > 0
      ? journalEntries[0].text
      : "No recent journal entry.";
  const recentMood =
    journalEntries.length > 0 ? journalEntries[0].mood : "okay";
  const moodFallback = recentMood;

  const cleanupAudio = () => {
    window.speechSynthesis.cancel();
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
      audioContextRef.current = null;
    }
    if (sourceNodesRef.current) {
      sourceNodesRef.current.forEach((node) => {
        try { node.stop(); } catch (e) {}
      });
      sourceNodesRef.current = [];
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => cleanupAudio();
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setScript(null);
    setAudioChunks([]);
    cleanupAudio();
    
    try {
      const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const result = await generateMeditation(
        intention || moodFallback,
        recentJournal,
        duration,
        currentTimeStr
      );
      setScript(result);
      
      setIsAudioLoading(true);
      try {
        const paragraphs = result.split('\n\n').filter(p => p.trim().length > 0);
        const chunkPromises = paragraphs.map(p => generateMeditationAudio(p));
        const resolvedAudio = await Promise.all(chunkPromises);
        const validChunks = resolvedAudio.filter(a => !!a) as string[];
        if (validChunks.length > 0) {
           setAudioChunks(validChunks);
        }
      } catch (e) {
        console.warn("TTS generation failed", e);
      } finally {
        setIsAudioLoading(false);
      }
    } catch (error) {
      console.error("Failed to generate meditation:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveMeditation = () => {
    if (!script) return;
    addMeditation({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      script,
      mood: (intention as Mood) || (moodFallback as Mood),
    });
    setScript(null);
    cleanupAudio();
  };

  const handleDiscard = () => {
    setScript(null);
    cleanupAudio();
  };

  const initAndPlayAudio = async (base64Array: string[]) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 24000 });
      audioContextRef.current = audioCtx;
      
      const buffers = [];
      for (const base64 of base64Array) {
          const binary = atob(base64);
          const audioData = new Int16Array(binary.length / 2);
          for (let i = 0; i < audioData.length; i++) {
            const byte1 = binary.charCodeAt(i * 2);
            const byte2 = binary.charCodeAt(i * 2 + 1);
            audioData[i] = (byte2 << 8) | byte1;
          }
          
          const buffer = audioCtx.createBuffer(1, audioData.length, 24000);
          const channelData = buffer.getChannelData(0);
          for (let i = 0; i < audioData.length; i++) {
            channelData[i] = audioData[i] / 32768.0;
          }
          buffers.push(buffer);
      }
      
      sourceNodesRef.current = [];
      const totalAudioDuration = buffers.reduce((sum, b) => sum + b.duration, 0);
      const targetDurationSeconds = duration * 60;
      const totalGapTime = Math.max(0, targetDurationSeconds - totalAudioDuration);
      const gapSeconds = buffers.length > 1 ? totalGapTime / (buffers.length - 1) : 0;
      
      let startTime = audioCtx.currentTime;
      for (let i = 0; i < buffers.length; i++) {
        const source = audioCtx.createBufferSource();
        source.buffer = buffers[i];
        source.connect(audioCtx.destination);
        source.start(startTime);
        sourceNodesRef.current.push(source);
        
        if (i === buffers.length - 1) {
           source.onended = () => {
             setIsPlaying(false);
             if (audioRef.current) audioRef.current.pause();
           };
        }
        startTime += buffers[i].duration + gapSeconds;
      }
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  };

  const togglePlayback = async () => {
    if (isPlaying) {
      if (audioContextRef.current && audioContextRef.current.state === "running") {
        await audioContextRef.current.suspend();
      }
      window.speechSynthesis.cancel();
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
        if (isMusicEnabled && audioRef.current) audioRef.current.play();
        setIsPlaying(true);
      } else if (audioChunks.length > 0) {
        await initAndPlayAudio(audioChunks);
        if (isMusicEnabled && audioRef.current) audioRef.current.play();
        setIsPlaying(true);
      } else if (script) {
        const utterance = new SpeechSynthesisUtterance(script);
        utterance.onend = () => {
          setIsPlaying(false);
          if (audioRef.current) audioRef.current.pause();
        };
        window.speechSynthesis.speak(utterance);
        if (isMusicEnabled && audioRef.current) audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleToggleMusic = () => {
    const newVal = !isMusicEnabled;
    setIsMusicEnabled(newVal);
    if (!newVal && audioRef.current) {
      audioRef.current.pause();
    } else if (newVal && isPlaying && audioRef.current) {
      audioRef.current.play();
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
        <h1 className="text-3xl font-serif font-medium text-stone-900">
          Breathe
        </h1>
        <p className="text-stone-500 mt-2">
          Mindfulness and meditation for your current state.
        </p>
      </header>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 mb-8">
        <h2 className="text-lg font-medium text-stone-900 mb-4 flex items-center gap-2">
          <Sparkles className="text-emerald-500" size={20} />
          Personalized Guide
        </h2>

        {!script ? (
          <div className="space-y-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                What is your intention or how are you feeling?
              </label>
              <textarea
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                placeholder="e.g. I want to feel more grounded, or I am feeling very anxious..."
                className="w-full p-4 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-200 resize-none text-stone-800 placeholder:text-stone-400"
                rows={3}
              />
            </div>
            
            <div className="mb-4">
               <label className="block text-sm font-medium text-stone-700 mb-2">
                 How long do you want to meditate?
               </label>
               <div className="flex gap-2">
                 {[3, 5, 10].map(mins => (
                   <button
                     key={mins}
                     onClick={() => setDuration(mins)}
                     className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                       duration === mins ? "bg-stone-900 text-white shadow-md border-stone-900" : "bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100"
                     }`}
                   >
                     {mins} min
                   </button>
                 ))}
               </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || (!intention.trim() && !moodFallback)}
              className="w-full mt-4 bg-emerald-50 text-emerald-700 rounded-xl py-4 font-medium flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Create Meditation"
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100 text-center relative overflow-hidden">
              <audio ref={audioRef} src={AMBIENT_MUSIC_URL} loop />
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 to-transparent pointer-events-none" />
              
              <div className="relative flex items-center justify-between mb-8">
                <div className="w-10"></div>
                <button
                  onClick={togglePlayback}
                  disabled={isAudioLoading && audioChunks.length === 0}
                  className={`w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center hover:bg-emerald-200 transition-colors shadow-sm ${isAudioLoading && audioChunks.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isAudioLoading && audioChunks.length === 0 ? (
                    <Loader2 size={24} className="animate-spin text-emerald-700" />
                  ) : isPlaying ? (
                    <Pause size={24} className="fill-current" />
                  ) : (
                    <Play size={24} className="fill-current ml-1" />
                  )}
                </button>
                <button 
                  onClick={handleToggleMusic}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isMusicEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-200 text-stone-500'}`}
                  title={isMusicEnabled ? "Disable Ambient Sounds" : "Enable Ambient Sounds"}
                >
                  {isMusicEnabled ? <Music size={18} /> : <VolumeX size={18} />}
                </button>
              </div>

              <div className="relative prose prose-sm prose-stone max-w-none whitespace-pre-wrap text-left leading-relaxed">
                {script}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDiscard}
                className="flex-1 py-3 rounded-xl text-sm font-medium bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleSaveMeditation}
                className="flex-1 py-3 rounded-xl text-sm font-medium bg-stone-900 text-white hover:bg-stone-800 transition-colors"
              >
                Save to Library
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium text-stone-900 px-2">
          Your Library
        </h2>
        {meditations.length === 0 ? (
          <p className="text-stone-500 text-center py-8">
            No saved meditations yet.
          </p>
        ) : (
          meditations.map((meditation) => (
            <div
              key={meditation.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-stone-900 capitalize">
                  {meditation.mood} Meditation
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  {new Date(meditation.date).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <button className="w-10 h-10 bg-stone-50 text-stone-600 rounded-full flex items-center justify-center hover:bg-stone-100 transition-colors">
                <Play size={16} className="fill-current ml-0.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};
