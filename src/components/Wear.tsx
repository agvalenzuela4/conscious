import React, { useState, useRef } from "react";
import { useAppContext } from "../context/AppContext";
import { analyzeClothing, suggestOutfit, getSustainableBuyingAdvice, continueSustainableBuyingAdvice } from "../lib/gemini";
import { motion } from "motion/react";
import { Shirt, Camera, Loader2, Sparkles, Upload, Leaf } from "lucide-react";
import heic2any from "heic2any";
import Markdown from "react-markdown";

export const Wear: React.FC = () => {
  const { wardrobe, addWardrobeItem } = useAppContext();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [occasion, setOccasion] = useState("");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [buyIntent, setBuyIntent] = useState("");
  const [isFetchingAdvice, setIsFetchingAdvice] = useState(false);
  const [buyingAdviceItems, setBuyingAdviceItems] = useState<{ role: string; text: string }[]>([]);
  const [buyingAdviceReply, setBuyingAdviceReply] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      let processingFile: Blob = file;
      
      // If it bypassed the OS filter and is still HEIC, manually convert
      if (
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        file.name.toLowerCase().endsWith(".heic") ||
        file.name.toLowerCase().endsWith(".heif")
      ) {
        try {
          const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.8 });
          processingFile = Array.isArray(converted) ? converted[0] : converted;
        } catch (e) {
          console.warn("HEIC conversion failed", e);
        }
      }

      // Read reliably into a Base64 Data URL (safe for cross-browser img rendering)
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') resolve(reader.result);
          else reject(new Error("FileReader failed"));
        };
        reader.onerror = reject;
        reader.readAsDataURL(processingFile);
      });

      const base64Data = dataUrl.split(",")[1];
      const mimeType = processingFile.type || "image/jpeg";

      const analysis = await analyzeClothing(base64Data, mimeType);

      addWardrobeItem({
        id: Date.now().toString(),
        imageUrl: dataUrl,
        description: analysis.description,
        category: analysis.category,
      });

    } catch (error) {
      console.error("Failed to analyze clothing:", error);
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSuggestOutfit = async () => {
    if (wardrobe.length === 0 || !occasion.trim()) return;
    setIsSuggesting(true);
    try {
      const descriptions = wardrobe.map((item) => item.description);
      const result = await suggestOutfit(descriptions, occasion);
      setSuggestion(result);
    } catch (error) {
      console.error("Failed to suggest outfit:", error);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleGetBuyingAdvice = async () => {
    if (!buyIntent.trim()) return;
    setIsFetchingAdvice(true);
    try {
      const result = await getSustainableBuyingAdvice(buyIntent);
      setBuyingAdviceItems([{ role: "ai", text: result }]);
    } catch (error) {
      console.error("Failed to get buying advice:", error);
    } finally {
      setIsFetchingAdvice(false);
    }
  };

  const handleReplyBuyingAdvice = async () => {
    if (!buyingAdviceReply.trim()) return;
    
    const newItems = [...buyingAdviceItems, { role: "user", text: buyingAdviceReply }];
    setBuyingAdviceItems(newItems);
    setBuyingAdviceReply("");
    setIsFetchingAdvice(true);

    try {
      // Send the history along with the new reply
      const response = await continueSustainableBuyingAdvice(
        buyIntent,
        buyingAdviceItems,
        newItems[newItems.length - 1].text
      );
      setBuyingAdviceItems((prev) => [...prev, { role: "ai", text: response }]);
    } catch (error) {
      console.error("Failed to continue buying advice:", error);
    } finally {
      setIsFetchingAdvice(false);
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
        <h1 className="text-3xl font-serif font-medium text-stone-900">Wear</h1>
        <p className="text-stone-500 mt-2">Conscious fashion and styling.</p>
      </header>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 mb-8">
        <h2 className="text-lg font-medium text-stone-900 mb-4 flex items-center gap-2">
          <Camera className="text-emerald-500" size={20} />
          Digitize Closet
        </h2>

        <div className="space-y-4">
          <p className="text-sm text-stone-600">
            Upload a photo of a clothing item to add it to your digital
            wardrobe.
          </p>
          <input
            type="file"
            accept="image/jpeg, image/png, image/webp"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="w-full bg-stone-50 text-stone-700 border-2 border-dashed border-stone-200 rounded-2xl py-8 font-medium flex flex-col items-center justify-center gap-3 hover:bg-stone-100 hover:border-stone-300 transition-colors disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={24} className="animate-spin text-stone-400" />{" "}
                Analyzing...
              </>
            ) : (
              <>
                <Upload size={24} className="text-stone-400" /> Upload Photo
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 mb-8">
        <h2 className="text-lg font-medium text-stone-900 mb-4 flex items-center gap-2">
          <Sparkles className="text-emerald-500" size={20} />
          Style Me
        </h2>

        <div className="space-y-4">
          <p className="text-sm text-stone-600">
            Tell me where you're going, and I'll style an outfit from your
            closet.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              placeholder="e.g., Casual coffee date, office..."
              className="flex-1 p-4 bg-stone-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-200 text-stone-800"
            />
            <button
              onClick={handleSuggestOutfit}
              disabled={
                isSuggesting || wardrobe.length === 0 || !occasion.trim()
              }
              className="bg-stone-900 text-white px-6 rounded-xl disabled:opacity-50 hover:bg-stone-800 transition-colors font-medium"
            >
              {isSuggesting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                "Style"
              )}
            </button>
          </div>

          {wardrobe.length === 0 && (
            <p className="text-xs text-amber-600 mt-2">
              Add items to your closet first!
            </p>
          )}

          {suggestion && (
            <div className="mt-4 bg-stone-50 p-5 rounded-2xl border border-stone-100 max-h-96 overflow-y-auto">
              <div className="text-sm text-stone-700 space-y-4 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>h3]:font-medium [&>h3]:text-stone-900 [&>h2]:font-medium [&>h2]:text-stone-900 [&>p]:leading-relaxed">
                <Markdown>{suggestion}</Markdown>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 mb-8">
        <h2 className="text-lg font-medium text-stone-900 mb-4 flex items-center gap-2">
          <Leaf className="text-emerald-500" size={20} />
          Mindful Shopping Guide
        </h2>

        <div className="space-y-4">
          <p className="text-sm text-stone-600">
            Looking to buy something new? Let me help you find sustainable and ethical options, fibers to avoid, and alternatives to fast fashion.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={buyIntent}
              onChange={(e) => setBuyIntent(e.target.value)}
              placeholder="e.g., A new pair of jeans, a summer dress..."
              className="flex-1 p-4 bg-stone-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-200 text-stone-800"
              onKeyDown={(e) => e.key === "Enter" && handleGetBuyingAdvice()}
            />
            <button
              onClick={handleGetBuyingAdvice}
              disabled={isFetchingAdvice || !buyIntent.trim()}
              className="bg-emerald-600 text-white px-6 rounded-xl disabled:opacity-50 hover:bg-emerald-700 transition-colors font-medium flex-shrink-0"
            >
              {isFetchingAdvice ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                "Guide Me"
              )}
            </button>
          </div>

          {buyingAdviceItems.length > 0 && (
            <div className="mt-4 bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 flex flex-col gap-4">
              <div className="max-h-96 overflow-y-auto space-y-4">
                {buyingAdviceItems.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-4 rounded-2xl max-w-[90%] ${msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-white shadow-sm border border-emerald-100 text-stone-700'}`}>
                      <div className={`text-sm ${msg.role === 'user' ? '[&>p]:leading-relaxed' : '[&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>h3]:font-medium [...msg.role === "ai" ? "[&>h3]:text-stone-900 [&>h2]:font-medium [&>h2]:text-stone-900 [&>p]:leading-relaxed [&>strong]:text-stone-900" : ""]'}`}>
                         <Markdown>{msg.text}</Markdown>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={buyingAdviceReply}
                  onChange={(e) => setBuyingAdviceReply(e.target.value)}
                  placeholder="Ask about pricing, styles, sizing..."
                  className="flex-1 p-3 bg-white rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-300 text-stone-800 text-sm shadow-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleReplyBuyingAdvice()}
                />
                <button
                  onClick={handleReplyBuyingAdvice}
                  disabled={isFetchingAdvice || !buyingAdviceReply.trim()}
                  className="bg-emerald-600 text-white px-4 rounded-xl disabled:opacity-50 hover:bg-emerald-700 transition-colors font-medium flex-shrink-0 text-sm"
                >
                  {isFetchingAdvice ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    "Ask"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium text-stone-900 px-2">
          Your Closet ({wardrobe.length})
        </h2>
        {wardrobe.length === 0 ? (
          <p className="text-stone-500 text-center py-8">
            Your digital closet is empty.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {wardrobe.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100"
              >
                <div className="aspect-square bg-stone-100 relative">
                  <img
                    src={item.imageUrl}
                    alt={item.description}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                    {item.category}
                  </p>
                  <p className="text-sm font-medium text-stone-900 line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
