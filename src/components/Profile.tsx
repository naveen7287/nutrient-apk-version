import React, { useState } from 'react';
import { 
  User, 
  Save, 
  Scale, 
  Ruler, 
  Calendar, 
  Activity, 
  Heart,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';

interface ProfileProps {
  profile: UserProfile | null;
  onUpdate: (profile: UserProfile) => void;
}

export default function Profile({ profile, onUpdate }: ProfileProps) {
  const [formData, setFormData] = useState<Partial<UserProfile>>(profile || {
    name: '',
    age: 25,
    height: 170,
    weight: 70,
    gender: 'male',
    activityLevel: 'moderate',
    healthIssues: '',
    unit: 'metric'
  });
  const [saving, setSaving] = useState(false);

  // Imperial conversion helpers
  const cmToFtIn = (cm: number) => {
    const totalInches = cm / 2.54;
    const ft = Math.floor(totalInches / 12);
    const inch = Math.round(totalInches % 12);
    return { ft, inch: inch === 12 ? 0 : inch, ft_adj: inch === 12 ? ft + 1 : ft };
  };

  const ftInToCm = (ft: number, inch: number) => {
    return Math.round(((ft * 12) + inch) * 2.54);
  };

  const kgToLbs = (kg: number) => Math.round(kg * 2.20462);
  const lbsToKg = (lbs: number) => Math.round(lbs / 2.20462);

  const { ft, inch } = cmToFtIn(formData.height || 170);
  const weightLbs = kgToLbs(formData.weight || 70);

  const calculateTargets = (data: Partial<UserProfile>) => {
    const { age, height, weight, gender, activityLevel } = data;
    if (!age || !height || !weight || !gender || !activityLevel) return null;

    // Mifflin-St Jeor Equation
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr = gender === 'male' ? bmr + 5 : bmr - 161;

    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };

    const tdee = bmr * multipliers[activityLevel];
    
    // Simple Macro Split
    const protein_g = Math.round(weight * 1.8);
    const fat_g = Math.round((tdee * 0.25) / 9);
    const carbs_g = Math.round((tdee - (protein_g * 4) - (fat_g * 9)) / 4);

    return {
      calories: Math.round(tdee),
      protein_g,
      fat_g,
      carbs_g
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const targets = calculateTargets(formData);
    const finalData = { ...formData, targets };

    const baseUrl = import.meta.env.VITE_APP_URL || '';
    try {
      const res = await fetch(`${baseUrl}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData)
      });
      
      // If backend returns the profile, use it. Otherwise use our local finalData
      const updatedProfile = await res.json().catch(() => finalData);
      
      // Merge local targets if backend didn't return them
      const profileToUpdate = {
        ...updatedProfile,
        targets: updatedProfile.targets || targets
      };

      onUpdate(profileToUpdate as UserProfile);
    } catch (error) {
      console.error('Error saving profile:', error);
      // Fallback to local update if server fails but we want to show progress
      if (targets) {
        onUpdate(finalData as UserProfile);
      }
    } finally {
      setSaving(false);
    }
  };

  const activityOptions = [
    { id: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
    { id: 'light', label: 'Light', desc: '1-3 days/week' },
    { id: 'moderate', label: 'Moderate', desc: '3-5 days/week' },
    { id: 'active', label: 'Active', desc: '6-7 days/week' },
    { id: 'very_active', label: 'Very Active', desc: 'Hard exercise 2x/day' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Health Profile</h1>
        <p className="text-gray-500">We use this information to calculate your personalized nutrition targets.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
              <User className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg">Basic Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
              <input 
                type="text" 
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Age</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={formData.age ?? ''}
                  onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 transition-all"
                  required
                />
                <Calendar className="absolute right-4 top-3.5 w-5 h-5 text-gray-300" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Gender</label>
            <div className="flex gap-4">
              {['male', 'female'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: g as any })}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-semibold capitalize transition-all",
                    formData.gender === g 
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100" 
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Physical Stats */}
        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">Physical Stats</h3>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-xl">
              {(['metric', 'imperial'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setFormData({ ...formData, unit: u })}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all",
                    formData.unit === u ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                Height {formData.unit === 'metric' ? '(cm)' : '(ft/in)'}
              </label>
              <div className="relative">
                {formData.unit === 'metric' ? (
                  <div className="relative">
                    <input 
                      type="number" 
                      value={formData.height ?? ''}
                      onChange={e => setFormData({ ...formData, height: parseInt(e.target.value) || 0 })}
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 transition-all"
                      required
                    />
                    <Ruler className="absolute right-4 top-3.5 w-5 h-5 text-gray-300" />
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <input 
                        type="number" 
                        value={ft}
                        onChange={e => setFormData({ ...formData, height: ftInToCm(parseInt(e.target.value) || 0, inch) })}
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 transition-all"
                        placeholder="ft"
                        required
                      />
                      <span className="absolute right-4 top-3.5 text-xs font-bold text-gray-300">ft</span>
                    </div>
                    <div className="relative flex-1">
                      <input 
                        type="number" 
                        value={inch}
                        onChange={e => setFormData({ ...formData, height: ftInToCm(ft, parseInt(e.target.value) || 0) })}
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 transition-all"
                        placeholder="in"
                        required
                      />
                      <span className="absolute right-4 top-3.5 text-xs font-bold text-gray-300">in</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                Weight {formData.unit === 'metric' ? '(kg)' : '(lbs)'}
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  value={formData.unit === 'metric' ? (formData.weight ?? '') : weightLbs}
                  onChange={e => {
                    const val = parseInt(e.target.value) || 0;
                    setFormData({ ...formData, weight: formData.unit === 'metric' ? val : lbsToKg(val) });
                  }}
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 transition-all"
                  required
                />
                <Scale className="absolute right-4 top-3.5 w-5 h-5 text-gray-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Activity Level */}
        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg">Activity Level</h3>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {activityOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFormData({ ...formData, activityLevel: opt.id as any })}
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left",
                  formData.activityLevel === opt.id 
                    ? "border-emerald-500 bg-emerald-50" 
                    : "border-gray-50 bg-gray-50 hover:border-gray-200"
                )}
              >
                <div>
                  <div className={cn("font-bold", formData.activityLevel === opt.id ? "text-emerald-700" : "text-gray-700")}>
                    {opt.label}
                  </div>
                  <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">{opt.desc}</div>
                </div>
                {formData.activityLevel === opt.id && <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white"><ChevronRight className="w-4 h-4" /></div>}
              </button>
            ))}
          </div>
        </div>

        {/* Health Issues */}
        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg">Health Considerations</h3>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Health Issues / Conditions</label>
            <textarea 
              value={formData.healthIssues || ''}
              onChange={e => setFormData({ ...formData, healthIssues: e.target.value })}
              className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 transition-all min-h-[100px]"
              placeholder="e.g. Diabetes, Hypertension, Cholesterol, Nut allergies..."
            />
            <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-50 p-3 rounded-lg">
              <Info className="w-4 h-4 shrink-0" />
              <p>This info helps our AI provide safer food recommendations based on your specific health needs.</p>
            </div>
          </div>
        </div>

        <button 
          type="submit"
          disabled={saving}
          className="w-full bg-emerald-500 text-white py-5 rounded-[2rem] font-bold text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {saving ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Activity className="w-6 h-6" /></motion.div>
          ) : (
            <>
              <Save className="w-6 h-6" />
              Save Changes & Calculate Targets
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
