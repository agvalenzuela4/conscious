import React from "react";
import { Brain, Activity, Utensils, Shirt, Wind, Home as HomeIcon } from "lucide-react";

export type Pillar = "home" | "mind" | "move" | "eat" | "wear" | "breathe";

interface NavigationProps {
  activePillar: Pillar;
  setActivePillar: (pillar: Pillar) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activePillar,
  setActivePillar,
}) => {
  const navItems = [
    { id: "home", icon: HomeIcon, label: "Home" },
    { id: "mind", icon: Brain, label: "Mind" },
    { id: "move", icon: Activity, label: "Move" },
    { id: "eat", icon: Utensils, label: "Eat" },
    { id: "wear", icon: Shirt, label: "Wear" },
    { id: "breathe", icon: Wind, label: "Breathe" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-2 sm:px-4 pb-safe pt-2 z-50">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePillar === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePillar(item.id as Pillar)}
              className={`flex flex-col items-center justify-center flex-1 h-14 rounded-xl transition-colors ${
                isActive
                  ? "text-emerald-600"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              <Icon
                size={22}
                className={isActive ? "stroke-[2.5px]" : "stroke-2"}
              />
              <span
                className={`text-[9px] sm:text-[10px] mt-1 font-medium ${isActive ? "opacity-100" : "opacity-70"}`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
