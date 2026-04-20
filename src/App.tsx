import React, { useState } from "react";
import { AppProvider } from "./context/AppContext";
import { Navigation, Pillar } from "./components/Navigation";
import { Home } from "./components/Home";
import { Mind } from "./components/Mind";
import { Move } from "./components/Move";
import { Eat } from "./components/Eat";
import { Wear } from "./components/Wear";
import { Breathe } from "./components/Breathe";
import { AnimatePresence } from "motion/react";

function AppContent() {
  const [activePillar, setActivePillar] = useState<Pillar>("home");

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-emerald-200 selection:text-emerald-900">
      <AnimatePresence mode="wait">
        {activePillar === "home" && <Home key="home" setActivePillar={setActivePillar} />}
        {activePillar === "mind" && <Mind key="mind" />}
        {activePillar === "move" && <Move key="move" />}
        {activePillar === "eat" && <Eat key="eat" />}
        {activePillar === "wear" && <Wear key="wear" />}
        {activePillar === "breathe" && <Breathe key="breathe" />}
      </AnimatePresence>
      <Navigation
        activePillar={activePillar}
        setActivePillar={setActivePillar}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
