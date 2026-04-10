import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Check, AlertTriangle, Activity, Beef, Droplets, Flame, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScanResult, UserProfile, MealLog } from '../types';

interface ScannerProps {
  profile: UserProfile | null;
  onLogAdded: (log: MealLog) => void;
}

export default function Scanner({ profile, onLogAdded }: ScannerProps) {
  const [sourceType, setSourceType] = useState<'homemade' | 'restaurant' | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [manualIngredients, setManualIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleScan = async () => {
    if (!image || !sourceType) return;
    setScanning(true);
    
    try {
      const base64Data = await fileToBase64(image);
      
      let baseUrl = import.meta.env.VITE_APP_URL || '';
      if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

      const targetUrl = `${baseUrl}/api/analyze`;
      console.log("DEBUG: Calling URL ->", targetUrl);

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          sourceType,
          profile
        }),
      });

      console.log("DEBUG: Status Code ->", response.status);

      const responseText = await response.text();
      console.log("DEBUG: Raw Response ->", responseText.substring(0, 200));

      if (!response.ok) {
        throw new Error(`Server Error: ${response.status} - ${responseText}`);
      }

      const data = JSON.parse(responseText);

      if (data.error) {
        alert(data.error);
      } else {
        setResult(data);
        setManualIngredients(data.ingredients || []);
        setShowConfirm(true);
      }
    } catch (error) {
      console.error('Scan error:', error);
      alert(error instanceof Error ? error.message : 'Failed to analyze image. Please try again.');
    } finally {
      setScanning(false);
    }
  };
  const handleConfirm = async () => {
    if (!result) return;
    let baseUrl = import.meta.env.VITE_APP_URL || '';
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

    try {
      const res = await fetch(`${baseUrl}/api/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_name: result.food_name,
          ingredients: manualIngredients,
          nutrition: result.nutrition,
          type: sourceType
        })
      });
      const newLog = await res.json();
      onLogAdded(newLog);
      reset();
    } catch (error) {
      console.error('Error logging meal:', error);
    }
  };

  const reset = () => {
    setSourceType(null); setImage(null); setPreview(null); setResult(null); setShowConfirm(false); setManualIngredients([]);
  };

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setManualIngredients([...manualIngredients, newIngredient.trim()]);
      setNewIngredient('');
    }
  };

  const removeIngredient = (index: number) => {
    setManualIngredients(manualIngredients.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">AI Food Scanner</h1>
        <p className="text-gray-500">Snap a photo of your meal for instant nutrition analysis.</p>
      </div>

      {!sourceType ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button onClick={() => setSourceType('homemade')} className="bg-white p-10 rounded-[2.5rem] border-2 border-transparent hover:border-emerald-500 transition-all group shadow-sm">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Activity className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Homemade</h3>
            <p className="text-gray-400 text-sm">Meals prepared at home with fresh ingredients.</p>
          </button>
          <button onClick={() => setSourceType('restaurant')} className="bg-white p-10 rounded-[2.5rem] border-2 border-transparent hover:border-blue-500 transition-all group shadow-sm">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Beef className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Restaurant</h3>
            <p className="text-gray-400 text-sm">Dining out or takeaway from restaurants.</p>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div onClick={() => !scanning && fileInputRef.current?.click()} className={cn("relative bg-white rounded-[2.5rem] border-4 border-dashed p-12 text-center transition-all cursor-pointer overflow-hidden", preview ? "border-emerald-500" : "border-gray-100 hover:border-emerald-200")}>
            {preview ? (
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-inner">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="py-10">
                <Upload className="w-10 h-10 text-gray-300 mx-auto mb-6" />
                <h3 className="text-xl font-bold mb-2">Upload Meal Photo</h3>
                <p className="text-gray-400">Click to browse or drag and drop</p>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) { setImage(file); setPreview(URL.createObjectURL(file)); }
            }} className="hidden" accept="image/*" />
          </div>

          <div className="flex gap-4">
            <button onClick={reset} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all">Cancel</button>
            <button onClick={handleScan} disabled={!image || scanning} className="flex-[2] bg-emerald-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {scanning ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Activity className="w-6 h-6" /></motion.div> : <><Camera className="w-6 h-6" /> Analyze Nutrition</>}
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showConfirm && result && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirm(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-8 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold">Confirm Nutrition</h2>
                  <button onClick={() => setShowConfirm(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6 text-gray-400" /></button>
                </div>
                <div className="space-y-8">
                  <div className="bg-emerald-50 p-6 rounded-3xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Detected Food</p>
                      <h3 className="text-2xl font-black text-emerald-900">{result.food_name}</h3>
                    </div>
                    <div className="bg-white p-3 rounded-2xl shadow-sm">
                      <span className="text-emerald-600 font-bold">{Math.round(result.confidence * 100)}% Match</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Calories', val: result.nutrition.calories, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
                      { label: 'Protein', val: result.nutrition.protein_g + 'g', icon: Beef, color: 'text-blue-500', bg: 'bg-blue-50' },
                      { label: 'Fat', val: result.nutrition.fat_g + 'g', icon: Droplets, color: 'text-amber-500', bg: 'bg-amber-50' },
                      { label: 'Carbs', val: result.nutrition.carbs_g + 'g', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50' },
                    ].map((n) => (
                      <div key={n.label} className={cn("p-4 rounded-2xl text-center", n.bg)}>
                        <n.icon className={cn("w-5 h-5 mx-auto mb-2", n.color)} />
                        <div className="text-lg font-black">{n.val}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{n.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
                <button onClick={() => setShowConfirm(false)} className="flex-1 bg-white border border-gray-200 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all">Edit</button>
                <button onClick={handleConfirm} className="flex-[2] bg-emerald-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"><Check className="w-6 h-6" /> Confirm & Add to Log</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...inputs: any[]) { return inputs.filter(Boolean).join(' '); }
