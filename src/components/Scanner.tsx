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

      const response = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data, sourceType, profile }),
      });

      if (!response.ok) throw new Error('Failed to analyze image');
      const data = await response.json();
      setResult(data);
      setManualIngredients(data.ingredients || []);
      setShowConfirm(true);
    } catch (error) {
      alert('Failed to analyze image. Please try again.');
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
        body: JSON.stringify({ food_name: result.food_name, ingredients: manualIngredients, nutrition: result.nutrition, type: sourceType })
      });
      onLogAdded(await res.json());
      reset();
    } catch (error) {}
  };

  const reset = () => {
    setSourceType(null); setImage(null); setPreview(null); setResult(null); setShowConfirm(false); setManualIngredients([]);
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6">AI Food Scanner</h1>
      {!sourceType ? (
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setSourceType('homemade')} className="p-6 bg-white rounded-2xl shadow">Homemade</button>
          <button onClick={() => setSourceType('restaurant')} className="p-6 bg-white rounded-2xl shadow">Restaurant</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed p-10 text-center rounded-2xl">
            {preview ? <img src={preview} className="max-h-60 mx-auto" /> : "Tap to upload photo"}
            <input type="file" ref={fileInputRef} onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) { setImage(file); setPreview(URL.createObjectURL(file)); }
            }} className="hidden" accept="image/*" />
          </div>
          <button onClick={handleScan} disabled={scanning} className="w-full bg-emerald-500 text-white p-4 rounded-xl font-bold">
            {scanning ? "Analyzing..." : "Analyze Nutrition"}
          </button>
        </div>
      )}

      {/* Confirmation Modal (Simplified for space) */}
      <AnimatePresence>
        {showConfirm && result && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">{result.food_name}</h2>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-gray-100 p-2 rounded">Cals: {result.nutrition.calories}</div>
                <div className="bg-gray-100 p-2 rounded">Protein: {result.nutrition.protein_g}g</div>
              </div>
              <button onClick={handleConfirm} className="w-full bg-emerald-500 text-white p-3 rounded-xl">Confirm & Log</button>
              <button onClick={() => setShowConfirm(false)} className="w-full mt-2 text-gray-500">Cancel</button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...inputs: any[]) { return inputs.filter(Boolean).join(' '); }
