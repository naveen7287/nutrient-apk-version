import React, { useState } from 'react';
import { 
  PlusCircle, 
  Flame, 
  Beef, 
  Droplets, 
  Activity, 
  Check,
  Plus,
  Trash2,
  Utensils
} from 'lucide-react';
import { motion } from 'motion/react';
import { MealLog, Nutrition } from '../types';

interface ManualEntryProps {
  onLogAdded: (log: MealLog) => void;
}

export default function ManualEntry({ onLogAdded }: ManualEntryProps) {
  const [foodName, setFoodName] = useState('');
  const [nutrition, setNutrition] = useState<Nutrition>({
    calories: 0,
    protein_g: 0,
    fat_g: 0,
    carbs_g: 0
  });
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName) return;
    setSaving(true);

    const logData = {
      food_name: foodName,
      ingredients,
      nutrition,
      type: 'manual'
    };

    const baseUrl = import.meta.env.VITE_APP_URL || '';
    try {
      const res = await fetch(`${baseUrl}/api/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      });
      const newLog = await res.json();
      onLogAdded(newLog);
      reset();
    } catch (error) {
      console.error('Error logging meal:', error);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setFoodName('');
    setNutrition({ calories: 0, protein_g: 0, fat_g: 0, carbs_g: 0 });
    setIngredients([]);
    setNewIngredient('');
  };

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients([...ingredients, newIngredient.trim()]);
      setNewIngredient('');
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Manual Entry</h1>
        <p className="text-gray-500">Log your meal manually if you already know the nutrition facts.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
              <Utensils className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg">Meal Details</h3>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Food Name</label>
            <input 
              type="text" 
              value={foodName}
              onChange={e => setFoodName(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 transition-all"
              placeholder="e.g. Grilled Chicken Salad"
              required
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            {[
              { label: 'Calories', key: 'calories', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
              { label: 'Protein (g)', key: 'protein_g', icon: Beef, color: 'text-blue-500', bg: 'bg-blue-50' },
              { label: 'Fat (g)', key: 'fat_g', icon: Droplets, color: 'text-amber-500', bg: 'bg-amber-50' },
              { label: 'Carbs (g)', key: 'carbs_g', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50' },
            ].map((n) => (
              <div key={n.label} className={cn("p-4 rounded-2xl text-center", n.bg)}>
                <n.icon className={cn("w-5 h-5 mx-auto mb-2", n.color)} />
                <input 
                  type="number" 
                  value={nutrition[n.key as keyof Nutrition]}
                  onChange={e => setNutrition({ ...nutrition, [n.key]: parseInt(e.target.value) || 0 })}
                  className="w-full bg-transparent border-none text-center text-lg font-black focus:ring-0 p-0"
                />
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{n.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-6">
          <h4 className="font-bold text-lg">Ingredients (Optional)</h4>
          <div className="flex flex-wrap gap-2">
            {ingredients.map((ing, idx) => (
              <div key={`${ing}-${idx}`} className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl flex items-center gap-2 group">
                <span className="text-sm font-medium text-gray-600">{ing}</span>
                <button type="button" onClick={() => removeIngredient(idx)} className="text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input 
              type="text" 
              value={newIngredient}
              onChange={e => setNewIngredient(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
              placeholder="Add ingredient..."
              className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500"
            />
            <button 
              type="button"
              onClick={addIngredient}
              className="bg-gray-100 text-gray-600 p-3 rounded-xl hover:bg-gray-200 transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <button 
          type="submit"
          disabled={saving || !foodName}
          className="w-full bg-emerald-500 text-white py-5 rounded-[2rem] font-bold text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {saving ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Activity className="w-6 h-6" /></motion.div>
          ) : (
            <>
              <Check className="w-6 h-6" />
              Log Meal
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
