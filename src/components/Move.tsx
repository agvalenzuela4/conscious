import React, { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { generateWorkout } from "../lib/gemini";
import { motion } from "motion/react";
import { Activity, Loader2, Plus, Sparkles, MapPin, Flame, Bike, Flower2, Waves, Users, Footprints } from "lucide-react";
import Markdown from "react-markdown";

const workoutTypes = [
  { id: 'cardio', label: 'Cardio', icon: Flame },
  { id: 'biking', label: 'Biking', icon: Bike },
  { id: 'yoga', label: 'Yoga', icon: Flower2 },
  { id: 'pilates', label: 'Pilates', icon: Activity },
  { id: 'swimming', label: 'Swimming', icon: Waves },
  { id: 'class', label: 'Studio Class', icon: Users },
];

export const Move: React.FC = () => {
  const { workouts, addWorkout, journalEntries } = useAppContext();
  const [energy, setEnergy] = useState("medium");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customWorkout, setCustomWorkout] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [customWalked, setCustomWalked] = useState(false);
  const [customWalkDuration, setCustomWalkDuration] = useState(15);
  const [duration, setDuration] = useState(30);
  const [weatherContext, setWeatherContext] = useState<string | undefined>();
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<string | null>(null);

  const recentMood =
    journalEntries.length > 0 ? journalEntries[0].mood : "okay";

  useEffect(() => {
    if (!weatherContext && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=fahrenheit`);
            const data = await res.json();
            if (data.current_weather) {
              const code = data.current_weather.weathercode;
              let condition = "clear";
              if (code >= 1 && code <= 3) condition = "partly cloudy";
              else if (code >= 45 && code <= 48) condition = "foggy";
              else if (code >= 51 && code <= 65) condition = "rainy";
              else if (code >= 71 && code <= 75) condition = "snowy";
              else if (code >= 95) condition = "stormy";
              
              setWeatherContext(`${data.current_weather.temperature}°F and ${condition}`);
            }
          } catch (e) {
            console.warn("Could not fetch weather", e);
          }
        },
        (err) => console.warn("Location access denied or failed", err),
        { timeout: 5000 }
      );
    }
  }, [weatherContext]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const result = await generateWorkout(energy, recentMood, currentTime, weatherContext, selectedWorkoutType || undefined);
      setSuggestion(result);
    } catch (error) {
      console.error("Failed to generate workout:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveWorkout = (description: string, durationMins: number, location?: string, walked?: boolean, walkDuration?: number) => {
    addWorkout({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      description,
      duration: durationMins,
      location,
      walked,
      walkDuration: walked ? walkDuration : undefined,
    });
    setSuggestion(null);
    setCustomWorkout("");
    setCustomLocation("");
    setCustomWalked(false);
    setCustomWalkDuration(15);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 max-w-md mx-auto min-h-screen pb-24"
    >
      <header className="mb-8">
        <h1 className="text-3xl font-serif font-medium text-stone-900">Move</h1>
        <p className="text-stone-500 mt-2">
          Personalized movement for your body and mind.
        </p>
      </header>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 mb-8">
        <h2 className="text-lg font-medium text-stone-900 mb-4 flex items-center gap-2">
          <Sparkles className="text-emerald-500" size={20} />
          AI Coach Suggestion
        </h2>

        {!suggestion ? (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-stone-600 mb-3">
                Based on your recent mood (
                <span className="font-semibold">{recentMood}</span>), let's find
                the right movement. How's your energy today?
              </p>
              <div className="flex gap-2">
                {["low", "medium", "high"].map((level) => (
                  <button
                    key={level}
                    onClick={() => setEnergy(level)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium capitalize transition-colors ${
                      energy === level
                        ? "bg-stone-900 text-white"
                        : "bg-stone-50 text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-stone-600 mb-3">
                What kind of movement are you looking for? (Optional)
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {workoutTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedWorkoutType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedWorkoutType(isSelected ? null : type.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl min-w-[80px] transition-all ${
                        isSelected
                          ? 'bg-emerald-50 border-2 border-emerald-200 text-emerald-800'
                          : 'bg-stone-50 border-2 border-transparent text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <Icon size={24} className="mb-2" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-emerald-50 text-emerald-700 rounded-xl py-4 font-medium flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
              >
                {isGenerating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  "Generate Routine"
                )}
              </button>
              <div className="flex items-center justify-center gap-1.5 text-xs text-stone-400 mt-3">
                <MapPin size={12} />
                <span>Uses local time & weather if location is enabled</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-stone-50 p-5 rounded-2xl border border-stone-100 overflow-hidden">
              <div className="prose prose-sm prose-stone max-w-none break-words">
                <Markdown>{suggestion}</Markdown>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSuggestion(null)}
                className="w-full py-3 rounded-xl text-sm font-medium bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
              >
                Try Another
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 mb-8">
        <h2 className="text-lg font-medium text-stone-900 mb-4">
          Log Custom Workout
        </h2>
        <div className="space-y-4">
          <input
            type="text"
            value={customWorkout}
            onChange={(e) => setCustomWorkout(e.target.value)}
            placeholder="Class or workout (e.g., Vinyasa Yoga)"
            className="w-full p-4 bg-stone-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-200 text-stone-800"
          />
          <input
            type="text"
            value={customLocation}
            onChange={(e) => setCustomLocation(e.target.value)}
            placeholder="Where did you go? (e.g., NOLA Studios)"
            className="w-full p-4 bg-stone-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-200 text-stone-800"
          />
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-24 p-4 bg-stone-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-200 text-stone-800"
              />
              <span className="text-stone-500 text-sm">min</span>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customWalked}
                  onChange={(e) => setCustomWalked(e.target.checked)}
                  className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300 accent-emerald-600"
                />
                <span className="text-sm text-stone-600">I walked there</span>
              </label>

              {customWalked && (
                <div className="flex items-center gap-2 pl-7 animate-in fade-in slide-in-from-top-1">
                  <span className="text-sm text-stone-500">Walk duration:</span>
                  <input
                    type="number"
                    value={customWalkDuration}
                    onChange={(e) => setCustomWalkDuration(Number(e.target.value))}
                    className="w-20 p-2 bg-emerald-50 rounded-lg border-none focus:ring-2 focus:ring-emerald-200 text-emerald-900 text-sm"
                  />
                  <span className="text-stone-500 text-sm">min</span>
                </div>
              )}
            </div>

            <button
              onClick={() => handleSaveWorkout(customWorkout, duration, customLocation, customWalked, customWalkDuration)}
              disabled={!customWorkout.trim()}
              className="w-full bg-stone-900 text-white p-4 rounded-xl disabled:opacity-50 hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 mt-2"
            >
              <Plus size={20} /> Log Activity
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium text-stone-900 px-2">
          Recent Activity
        </h2>
        {workouts.length === 0 ? (
          <p className="text-stone-500 text-center py-8">
            No workouts logged yet.
          </p>
        ) : (
          workouts.map((workout) => (
            <div
              key={workout.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-stone-900 line-clamp-1">
                  {workout.description}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <p className="text-xs text-stone-500">
                    {new Date(workout.date).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  {workout.location && (
                    <>
                      <span className="text-stone-300">•</span>
                      <p className="text-xs text-stone-500 flex items-center gap-1">
                        <MapPin size={10} />
                        {workout.location}
                      </p>
                    </>
                  )}
                  {workout.walked && (
                    <>
                      <span className="text-stone-300">•</span>
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <Footprints size={10} />
                        Walked {workout.walkDuration && `${workout.walkDuration}m`}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                <Activity size={14} />
                {workout.duration}m
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};
