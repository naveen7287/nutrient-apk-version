import React from 'react';
import { 
  Flame, 
  Beef, 
  Droplets, 
  Activity, 
  ChevronRight,
  AlertCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile, MealLog, DailyTotals } from '../types';

interface DashboardProps {
  profile: UserProfile | null;
  logs: MealLog[];
  onNavigateToProfile: () => void;
}

export default function Dashboard({ profile, logs, onNavigateToProfile }: DashboardProps) {
  const dailyTotals: DailyTotals = logs.reduce((acc, log) => ({
    calories: acc.calories + log.nutrition.calories,
    protein: acc.protein + log.nutrition.protein_g,
    fat: acc.fat + log.nutrition.fat_g,
    carbs: acc.carbs + log.nutrition.carbs_g,
  }), { calories: 0, protein: 0, fat: 0, carbs: 0 });

  if (!profile || !profile.targets) {
    return (
      <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <User className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Welcome to NutrientApk</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          {profile ? "Your profile is incomplete. Please update it to calculate your nutrition targets." : "Complete your health profile to get personalized calorie and macro targets tailored to your goals."}
        </p>
        <button 
          onClick={onNavigateToProfile}
          className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
        >
          {profile ? "Update Profile" : "Complete Profile"}
        </button>
      </div>
    );
  }

  const targets = profile.targets;
  const calProgress = Math.min((dailyTotals.calories / targets.calories) * 100, 100);
  const isOverLimit = dailyTotals.calories > targets.calories;

  const macroStats = [
    { label: 'Protein', current: dailyTotals.protein, target: targets.protein_g, unit: 'g', icon: Beef, color: 'text-blue-500', bg: 'bg-blue-50', bar: 'bg-blue-500' },
    { label: 'Fat', current: dailyTotals.fat, target: targets.fat_g, unit: 'g', icon: Droplets, color: 'text-amber-500', bg: 'bg-amber-50', bar: 'bg-amber-500' },
    { label: 'Carbs', current: dailyTotals.carbs, target: targets.carbs_g, unit: 'g', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50', bar: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hello, {profile.name}!</h1>
          <p className="text-gray-500">Here's your nutrition summary for today.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
          <Clock className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-medium text-gray-600">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Main Calorie Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Calories</h3>
                  <p className="text-sm text-gray-500">Daily Intake</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black">{dailyTotals.calories}</span>
                <span className="text-gray-400 font-medium ml-1">/ {targets.calories} kcal</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${calProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full",
                    isOverLimit ? "bg-red-500" : "bg-gradient-to-r from-orange-400 to-orange-500"
                  )}
                />
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className={isOverLimit ? "text-red-500" : "text-gray-500"}>
                  {isOverLimit ? `${dailyTotals.calories - targets.calories} kcal over target` : `${targets.calories - dailyTotals.calories} kcal remaining`}
                </span>
                <span className="text-gray-400">{Math.round(calProgress)}%</span>
              </div>
            </div>
          </div>
          
          {/* Decorative background element */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-orange-50 rounded-full opacity-50 blur-3xl" />
        </div>

        {/* Quick Stats */}
        <div className="bg-emerald-500 rounded-[2rem] p-8 text-white shadow-lg shadow-emerald-200 flex flex-col justify-between">
          <div>
            <TrendingUp className="w-8 h-8 mb-4 opacity-80" />
            <h3 className="text-xl font-bold mb-2">Health Score</h3>
            <p className="text-emerald-50 opacity-80 text-sm">Based on your recent logs and profile targets.</p>
          </div>
          <div className="mt-8">
            <div className="text-5xl font-black mb-2">84</div>
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-100">
              <span className="bg-white/20 px-2 py-0.5 rounded-lg">+12% from yesterday</span>
            </div>
          </div>
        </div>
      </div>

      {/* Macro Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {macroStats.map((macro) => {
          const progress = Math.min((macro.current / macro.target) * 100, 100);
          return (
            <div key={macro.label} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", macro.bg, macro.color)}>
                  <macro.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{macro.label}</span>
              </div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-bold">{macro.current}</span>
                <span className="text-gray-400 text-sm font-medium">{macro.unit} / {macro.target}{macro.unit}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                  className={cn("h-full rounded-full", macro.bar)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Logs */}
      <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold">Today's Logs</h2>
          <button className="text-emerald-500 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium">No meals logged today yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log, index) => (
              <div key={log.id || `log-${index}`} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 group-hover:bg-white transition-colors shadow-sm">
                    {log.type === 'homemade' ? <Activity className="w-6 h-6" /> : <Beef className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{log.food_name}</h4>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-tighter">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {log.type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{log.nutrition.calories} kcal</div>
                  <div className="text-xs text-gray-400 font-medium">
                    P: {log.nutrition.protein_g}g • F: {log.nutrition.fat_g}g • C: {log.nutrition.carbs_g}g
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alerts */}
      {isOverLimit && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-4 text-red-600"
        >
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p className="text-sm font-medium">
            You've exceeded your daily calorie target. Try to balance your next meals with lower calorie options.
          </p>
        </motion.div>
      )}
    </div>
  );
}

// Helper for conditional classes
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

function User(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
