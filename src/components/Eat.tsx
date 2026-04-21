import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { generateRecipe, generateShoppingList } from "../lib/gemini";
import { motion, AnimatePresence } from "motion/react";
import { Utensils, Loader2, Leaf, Plus, ChevronDown, ChevronUp, Check, X, Sparkles } from "lucide-react";
import Markdown from "react-markdown";

const APPLIANCES = [
  "Stovetop",
  "Oven",
  "Microwave",
  "Air fryer",
  "Instant Pot",
  "Blender",
  "Rice cooker",
  "Toaster oven",
  "Hot plate only",
];

const COMFORT_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
];

const PREP_TIMES = [
  "Under 15 mins",
  "15-30 mins",
  "30-60 mins",
  "Over 1 hour",
];

const DIETS = [
  "Vegan",
  "Vegetarian",
  "Pescatarian",
  "High Protein",
  "Low Carb",
  "Keto",
  "Paleo",
  "Kosher",
  "Halal",
];

const ALLERGIES = [
  "Dairy-free",
  "Gluten-free",
  "Nut-free",
  "Soy-free",
  "Egg-free",
  "Shellfish-free",
  "Fish-free",
  "Pork-free",
  "Red meat-free",
  "Garlic-free",
  "Onion-free",
  "Sesame-free",
  "Nightshade-free",
];

export const Eat: React.FC = () => {
  const { meals, addMeal, shoppingList, addShoppingItem, toggleShoppingItem, removeShoppingItem } = useAppContext();
  const [ingredients, setIngredients] = useState("");
  const [recipe, setRecipe] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingShoppingList, setIsGeneratingShoppingList] = useState(false);
  const [customMeal, setCustomMeal] = useState("");
  const [mealIdeas, setMealIdeas] = useState("");
  const [shoppingSuggestions, setShoppingSuggestions] = useState("");
  const [newShoppingItem, setNewShoppingItem] = useState("");
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [selectedAppliances, setSelectedAppliances] = useState<string[]>([]);
  const [comfortLevel, setComfortLevel] = useState<string>("");
  const [timeCommitment, setTimeCommitment] = useState<string>("");
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);

  const toggleAppliance = (app: string) => {
    setSelectedAppliances((prev) =>
      prev.includes(app) ? prev.filter((a) => a !== app) : [...prev, app]
    );
  };

  const toggleDiet = (diet: string) => {
    setSelectedDiets((prev) =>
      prev.includes(diet) ? prev.filter((d) => d !== diet) : [...prev, diet]
    );
  };

  const toggleAllergy = (allergy: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy]
    );
  };

  const handleGenerate = async () => {
    if (!ingredients.trim()) return;
    setIsGenerating(true);
    try {
      const result = await generateRecipe(
        ingredients,
        selectedDiets.join(", "),
        selectedAllergies.join(", "),
        selectedAppliances.join(", "),
        comfortLevel,
        timeCommitment
      );
      setRecipe(result);
    } catch (error) {
      console.error("Failed to generate recipe:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateShoppingList = async () => {
    setIsGeneratingShoppingList(true);
    setShoppingSuggestions("");
    try {
      const result = await generateShoppingList(
        selectedDiets.join(", "),
        selectedAllergies.join(", "),
        mealIdeas
      );
      if (result.suggestions) {
        setShoppingSuggestions(result.suggestions);
      }
      result.items.forEach((item: string) => addShoppingItem(item));
    } catch (error) {
      console.error("Failed to generate shopping list:", error);
    } finally {
      setIsGeneratingShoppingList(false);
    }
  };

  const handleSaveMeal = (description: string, recipeText?: string, ingredientsText?: string) => {
    addMeal({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      description,
      recipe: recipeText,
      inputIngredients: ingredientsText,
      carbonFootprint: "Low Impact", // Simplified for now
    });
    setRecipe(null);
    setIngredients("");
    setCustomMeal("");
    setSelectedDiets([]);
    setSelectedAllergies([]);
    setSelectedAppliances([]);
    setComfortLevel("");
    setTimeCommitment("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 max-w-md mx-auto min-h-screen pb-24"
    >
      <header className="mb-8">
        <h1 className="text-3xl font-serif font-medium text-stone-900">Eat</h1>
        <p className="text-stone-500 mt-2">
          Sustainable nutrition for you and the planet.
        </p>
      </header>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 mb-8">
        <h2 className="text-lg font-medium text-stone-900 mb-4 flex items-center gap-2">
          <Leaf className="text-emerald-500" size={20} />
          Fridge to Table
        </h2>

        {!recipe ? (
          <div className="space-y-4">
            <p className="text-sm text-stone-600">
              Tell me what's in your fridge, and I'll suggest a low-impact
              recipe.
            </p>
            <div className="space-y-3">
              <textarea
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="Ingredients: e.g., half an onion, some spinach, chickpeas, rice..."
                className="w-full h-24 p-4 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-200 resize-none text-stone-800 placeholder:text-stone-400"
              />
            </div>
            
            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-stone-900 border-b border-stone-100 pb-2">
                Dietary Preferences
              </p>
              <div className="flex flex-wrap gap-2">
                {DIETS.map((d) => {
                  const isSelected = selectedDiets.includes(d);
                  return (
                    <button
                      key={d}
                      onClick={() => toggleDiet(d)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                        isSelected
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                          : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300"
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-stone-900 border-b border-stone-100 pb-2">
                Allergies & Restrictions
              </p>
              <div className="flex flex-wrap gap-2">
                {ALLERGIES.map((a) => {
                  const isSelected = selectedAllergies.includes(a);
                  return (
                    <button
                      key={a}
                      onClick={() => toggleAllergy(a)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                        isSelected
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                          : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300"
                      }`}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-stone-900 border-b border-stone-100 pb-2">
                What is your comfort level in the kitchen?
              </p>
              <div className="flex flex-wrap gap-2">
                {COMFORT_LEVELS.map((level) => {
                  const isSelected = comfortLevel === level;
                  return (
                    <button
                      key={level}
                      onClick={() => setComfortLevel(isSelected ? "" : level)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                        isSelected
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                          : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300"
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-stone-900 border-b border-stone-100 pb-2">
                What cooking equipment do you have?
              </p>
              <div className="flex flex-wrap gap-2">
                {APPLIANCES.map((app) => {
                  const isSelected = selectedAppliances.includes(app);
                  return (
                    <button
                      key={app}
                      onClick={() => toggleAppliance(app)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                        isSelected
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                          : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300"
                      }`}
                    >
                      {app}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-stone-900 border-b border-stone-100 pb-2">
                What is your preferred time commitment?
              </p>
              <div className="flex flex-wrap gap-2">
                {PREP_TIMES.map((time) => {
                  const isSelected = timeCommitment === time;
                  return (
                    <button
                      key={time}
                      onClick={() => setTimeCommitment(isSelected ? "" : time)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                        isSelected
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                          : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300"
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !ingredients.trim()}
              className="w-full bg-emerald-50 text-emerald-700 rounded-xl py-4 font-medium flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Get Recipe"
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-stone-50 p-5 rounded-2xl border border-stone-100 max-h-96 overflow-y-auto">
              <div className="text-sm text-stone-700 space-y-4 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>h3]:font-medium [&>h3]:text-stone-900 [&>h2]:font-medium [&>h2]:text-stone-900 [&>p]:leading-relaxed [&>strong]:text-stone-900 [&>h1]:text-lg [&>h1]:font-serif [&>h1]:font-medium [&>h1]:text-stone-900 [&>h1]:mb-2">
                <Markdown>{recipe}</Markdown>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRecipe(null)}
                className="flex-1 py-3 rounded-xl text-sm font-medium bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
              >
                Try Another
              </button>
              <button
                onClick={() => {
                  const name = recipe ? recipe.trim().split('\n')[0].replace(/[#*]/g, '').trim() : "Generated Recipe";
                  handleSaveMeal(name || "Generated Recipe", recipe || undefined, ingredients);
                }}
                className="flex-1 py-3 rounded-xl text-sm font-medium bg-stone-900 text-white hover:bg-stone-800 transition-colors"
              >
                Log Meal
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 mb-8">
        <h2 className="text-lg font-medium text-stone-900 mb-4">
          Log Custom Meal
        </h2>
        <div className="flex gap-4 items-center">
          <input
            type="text"
            value={customMeal}
            onChange={(e) => setCustomMeal(e.target.value)}
            placeholder="e.g., Lentil soup from local cafe"
            className="flex-1 p-4 bg-stone-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-200 text-stone-800"
          />
          <button
            onClick={() => handleSaveMeal(customMeal)}
            disabled={!customMeal.trim()}
            className="bg-stone-900 text-white p-4 rounded-xl disabled:opacity-50 hover:bg-stone-800 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 mb-8">
        <h2 className="text-lg font-medium text-stone-900 mb-4 flex items-center gap-2">
          <Leaf className="text-emerald-500" size={20} />
          Sustainable Shopping List
        </h2>
        <div className="space-y-4">
          <textarea
            value={mealIdeas}
            onChange={(e) => setMealIdeas(e.target.value)}
            placeholder="Planning meals? e.g., Mexican bowl, stir fry, pasta..."
            className="w-full h-20 p-4 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-200 resize-none text-stone-800 placeholder:text-stone-400"
          />
          <button
            onClick={handleGenerateShoppingList}
            disabled={isGeneratingShoppingList}
            className="w-full bg-emerald-100 text-emerald-800 rounded-xl py-3 font-medium flex items-center justify-center gap-2 hover:bg-emerald-200 transition-colors disabled:opacity-50"
          >
            {isGeneratingShoppingList ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <Sparkles size={18} className="text-emerald-600" />
                Auto-Generate List
              </>
            )}
          </button>
          
          {shoppingSuggestions && (
            <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 text-sm text-emerald-900 leading-relaxed shadow-sm">
              <Markdown>{shoppingSuggestions}</Markdown>
            </div>
          )}
          
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-stone-200"></div>
            <span className="flex-shrink-0 mx-4 text-stone-400 text-xs font-medium uppercase tracking-wider">or add manually</span>
            <div className="flex-grow border-t border-stone-200"></div>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={newShoppingItem}
              onChange={(e) => setNewShoppingItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newShoppingItem.trim()) {
                  addShoppingItem(newShoppingItem.trim());
                  setNewShoppingItem("");
                }
              }}
              placeholder="Add an item to buy..."
              className="flex-1 p-4 bg-stone-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-200 text-stone-800"
            />
            <button
              onClick={() => {
                if (newShoppingItem.trim()) {
                  addShoppingItem(newShoppingItem.trim());
                  setNewShoppingItem("");
                }
              }}
              disabled={!newShoppingItem.trim()}
              className="bg-emerald-50 text-emerald-700 p-4 rounded-xl disabled:opacity-50 hover:bg-emerald-100 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          
          {shoppingList.length > 0 && (
            <motion.div layout className="space-y-2 mt-4">
              <AnimatePresence mode="popLayout">
                {[...shoppingList]
                  .sort((a, b) => (a.isChecked === b.isChecked ? 0 : a.isChecked ? 1 : -1))
                  .map((item) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      key={item.id} 
                      className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                        item.isChecked 
                          ? "bg-stone-50 border-stone-100 opacity-60" 
                          : "bg-white border-stone-200"
                      }`}
                    >
                      <button 
                        onClick={() => toggleShoppingItem(item.id)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full border transition-colors ${
                          item.isChecked 
                            ? "bg-emerald-500 border-emerald-500 text-white" 
                            : "border-stone-300"
                        }`}>
                          {item.isChecked && <Check size={14} strokeWidth={3} />}
                        </div>
                        <span className={`text-stone-800 transition-all ${item.isChecked ? "line-through text-stone-500" : ""}`}>
                          {item.name}
                        </span>
                      </button>
                      <button 
                        onClick={() => removeShoppingItem(item.id)}
                        className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </motion.div>
                  ))
                }
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium text-stone-900 px-2">
          Recent Meals
        </h2>
        {meals.length === 0 ? (
          <p className="text-stone-500 text-center py-8">
            No meals logged yet.
          </p>
        ) : (
          meals.map((meal) => {
            const isExpanded = expandedMealId === meal.id;
            return (
              <div
                key={meal.id}
                className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden"
              >
                <div 
                  className={`p-5 cursor-pointer transition-colors ${meal.recipe ? 'hover:bg-stone-50' : ''}`}
                  onClick={() => meal.recipe && setExpandedMealId(isExpanded ? null : meal.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-stone-900 line-clamp-2 pr-4">{meal.description}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap">
                        <Leaf size={12} />
                        {meal.carbonFootprint}
                      </div>
                      {meal.recipe && (
                        <div className="text-stone-400">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-stone-500">
                    {new Date(meal.date).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                
                {isExpanded && meal.recipe && (
                  <div className="px-5 pb-5 border-t border-stone-100">
                    <div className="pt-4 space-y-4">
                      {meal.inputIngredients && (
                        <div className="bg-stone-50 rounded-xl p-4">
                          <p className="text-xs font-medium text-stone-500 mb-1 uppercase tracking-wider">Your Ingredients</p>
                          <p className="text-sm text-stone-700">{meal.inputIngredients}</p>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-xs font-medium text-stone-500 mb-2 uppercase tracking-wider">Recipe</p>
                        <div className="text-sm text-stone-700 space-y-4 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>h3]:font-medium [&>h3]:text-stone-900 [&>h2]:font-medium [&>h2]:text-stone-900 [&>p]:leading-relaxed [&>strong]:text-stone-900 [&>h1]:hidden">
                          <Markdown>{meal.recipe}</Markdown>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};
