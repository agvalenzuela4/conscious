import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Mood = "great" | "good" | "okay" | "stressed" | "anxious" | "tired";

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  text: string;
  mood: Mood;
  aiReflection?: string;
  thread?: ChatMessage[];
}

export interface Meal {
  id: string;
  date: string;
  description: string;
  recipe?: string;
  inputIngredients?: string;
  carbonFootprint?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  isChecked: boolean;
}

export interface WardrobeItem {
  id: string;
  imageUrl: string;
  description: string;
  category: string;
}

export interface Workout {
  id: string;
  date: string;
  description: string;
  duration: number;
  location?: string;
  walked?: boolean;
  walkDuration?: number;
}

export interface Meditation {
  id: string;
  date: string;
  script: string;
  mood: Mood;
}

interface AppState {
  journalEntries: JournalEntry[];
  meals: Meal[];
  shoppingList: ShoppingItem[];
  wardrobe: WardrobeItem[];
  workouts: Workout[];
  meditations: Meditation[];
  addJournalEntry: (entry: JournalEntry) => void;
  addMeal: (meal: Meal) => void;
  addShoppingItem: (name: string) => void;
  toggleShoppingItem: (id: string) => void;
  removeShoppingItem: (id: string) => void;
  addWardrobeItem: (item: WardrobeItem) => void;
  addWorkout: (workout: Workout) => void;
  addMeditation: (meditation: Meditation) => void;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem("journalEntries");
    return saved ? JSON.parse(saved) : [];
  });
  const [meals, setMeals] = useState<Meal[]>(() => {
    const saved = localStorage.getItem("meals");
    return saved ? JSON.parse(saved) : [];
  });
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => {
    const saved = localStorage.getItem("shoppingList");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure all IDs are strongly unique (migrating old bad state)
        const seenIds = new Set();
        return parsed.map((item: ShoppingItem, idx: number) => {
          let uniqueId = item.id;
          if (seenIds.has(uniqueId) || !uniqueId) {
            uniqueId = uniqueId + '-' + idx + '-' + Math.random().toString(36).substr(2, 5);
          }
          seenIds.add(uniqueId);
          return { ...item, id: uniqueId };
        });
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(() => {
    const saved = localStorage.getItem("wardrobe");
    return saved ? JSON.parse(saved) : [];
  });
  const [workouts, setWorkouts] = useState<Workout[]>(() => {
    const saved = localStorage.getItem("workouts");
    return saved ? JSON.parse(saved) : [];
  });
  const [meditations, setMeditations] = useState<Meditation[]>(() => {
    const saved = localStorage.getItem("meditations");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("journalEntries", JSON.stringify(journalEntries));
  }, [journalEntries]);

  useEffect(() => {
    localStorage.setItem("meals", JSON.stringify(meals));
  }, [meals]);

  useEffect(() => {
    localStorage.setItem("shoppingList", JSON.stringify(shoppingList));
  }, [shoppingList]);

  useEffect(() => {
    localStorage.setItem("wardrobe", JSON.stringify(wardrobe));
  }, [wardrobe]);

  useEffect(() => {
    localStorage.setItem("workouts", JSON.stringify(workouts));
  }, [workouts]);

  useEffect(() => {
    localStorage.setItem("meditations", JSON.stringify(meditations));
  }, [meditations]);

  const addJournalEntry = (entry: JournalEntry) =>
    setJournalEntries((prev) => [entry, ...prev]);
  const addMeal = (meal: Meal) => setMeals((prev) => [meal, ...prev]);
  
  const addShoppingItem = (name: string) => {
    setShoppingList((prev) => [
      { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), name, isChecked: false },
      ...prev,
    ]);
  };
  const toggleShoppingItem = (id: string) => {
    setShoppingList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isChecked: !item.isChecked } : item
      )
    );
  };
  const removeShoppingItem = (id: string) => {
    setShoppingList((prev) => prev.filter((item) => item.id !== id));
  };
  const addWardrobeItem = (item: WardrobeItem) =>
    setWardrobe((prev) => [item, ...prev]);
  const addWorkout = (workout: Workout) =>
    setWorkouts((prev) => [workout, ...prev]);
  const addMeditation = (meditation: Meditation) =>
    setMeditations((prev) => [meditation, ...prev]);

  const updateJournalEntry = (id: string, updates: Partial<JournalEntry>) =>
    setJournalEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry))
    );

  return (
    <AppContext.Provider
      value={{
        journalEntries,
        meals,
        shoppingList,
        wardrobe,
        workouts,
        meditations,
        addJournalEntry,
        addMeal,
        addShoppingItem,
        toggleShoppingItem,
        removeShoppingItem,
        addWardrobeItem,
        addWorkout,
        addMeditation,
        updateJournalEntry,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
