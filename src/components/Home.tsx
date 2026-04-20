import React from "react";
import { motion } from "motion/react";
import { Brain, Activity, Utensils, Shirt, Wind, ArrowRight } from "lucide-react";
import { Pillar } from "./Navigation";

interface HomeProps {
  setActivePillar: (pillar: Pillar) => void;
}

export const Home: React.FC<HomeProps> = ({ setActivePillar }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const pillars = [
    {
      id: "mind",
      title: "Mind",
      description: "Journal, reflect, and process your emotions.",
      icon: Brain,
      color: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      id: "move",
      title: "Move",
      description: "Personalized movement for your body.",
      icon: Activity,
      color: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      id: "eat",
      title: "Eat",
      description: "Sustainable nutrition and low-impact recipes.",
      icon: Utensils,
      color: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      id: "wear",
      title: "Wear",
      description: "Conscious fashion and closet styling.",
      icon: Shirt,
      color: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      id: "breathe",
      title: "Breathe",
      description: "Mindfulness and guided meditation.",
      icon: Wind,
      color: "bg-teal-50",
      iconColor: "text-teal-600",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 max-w-md mx-auto min-h-screen pb-24"
    >
      <header className="mb-10 mt-4">
        <p className="text-stone-500 font-medium mb-1">{getGreeting()},</p>
        <h1 className="text-4xl font-serif font-medium text-stone-900 leading-tight">
          Welcome to Conscious.
        </h1>
        <p className="text-stone-600 mt-4 leading-relaxed">
          Your AI-powered hub for intentional living. Where would you like to focus today?
        </p>
      </header>

      <div className="grid gap-4">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <button
              key={pillar.id}
              onClick={() => setActivePillar(pillar.id as Pillar)}
              className="flex items-center text-left p-5 bg-white rounded-3xl shadow-sm border border-stone-100 hover:shadow-md hover:border-stone-200 transition-all group"
            >
              <div className={`w-14 h-14 rounded-2xl ${pillar.color} flex items-center justify-center shrink-0 mr-4 group-hover:scale-105 transition-transform`}>
                <Icon className={pillar.iconColor} size={28} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-stone-900 mb-1">
                  {pillar.title}
                </h3>
                <p className="text-sm text-stone-500 line-clamp-2">
                  {pillar.description}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center shrink-0 text-stone-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                <ArrowRight size={16} />
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};
