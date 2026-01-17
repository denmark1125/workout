
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DietLog, MealRecord, MacroNutrients, UserProfile, WorkoutLog } from '../types';
import { analyzeFoodImage } from '../services/geminiService';
import { getTaiwanDate } from '../utils/calculations';
import { FOOD_DATABASE, FoodItem } from '../utils/foodDatabase';
import { Plus, Camera, ChevronLeft, ChevronRight, X, Loader2, Utensils, Flame, Droplets, Beef, Wheat, Sandwich, Moon, Sun, Coffee, Trash2, Search, Database, QrCode } from 'lucide-react';
import TacticalLoader from './TacticalLoader';

interface NutritionDeckProps {
  dietLogs: DietLog[];
  onUpdateDietLog: (log: DietLog) => void;
  profile: UserProfile;
  workoutLogs: WorkoutLog[];
}

const MEAL_TYPES = {
  breakfast: { label: '早餐 BREAKFAST', icon: <Coffee size={16}/> },
  lunch: { label: '午餐 LUNCH', icon: <Sun size={16}/> },
  dinner: { label: '晚餐 DINNER', icon: <Utensils size={16}/> },
  snack: { label: '點心 SNACK', icon: <Sandwich size={16}/> },
  nightSnack: { label: '宵夜 NIGHT SNACK', icon: <Moon size={16}/> }
};

const NutritionDeck: React.FC<NutritionDeckProps> = ({ dietLogs = [], onUpdateDietLog, profile, workoutLogs }) => {
  const [selectedDate, setSelectedDate] = useState(getTaiwanDate());
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeMealType, setActiveMealType] = useState<keyof typeof MEAL_TYPES>('breakfast');
  const [addMode, setAddMode] = useState<'CAMERA' | 'DATABASE' | 'CUSTOM'>('DATABASE');
  
  const [newMealName, setNewMealName] = useState('');
  const [newMealCals, setNewMealCals] = useState('');
  const [newMealP, setNewMealP] = useState('');
  const [newMealC, setNewMealC] = useState('');
  const [newMealF, setNewMealF] = useState('');
  const [newMealImage, setNewMealImage] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentLog = useMemo(() => {
    const log = dietLogs.find(l => l.date === selectedDate);
    // 強化安全性：確保 meals 物件及其所有時段皆為陣列
    const baseLog = log || {
      id: selectedDate, date: selectedDate,
      meals: {},
      waterIntake: 0
    };
    
    const safeMeals = {
      breakfast: Array.isArray(baseLog.meals?.breakfast) ? baseLog.meals.breakfast : [],
      lunch: Array.isArray(baseLog.meals?.lunch) ? baseLog.meals.lunch : [],
      dinner: Array.isArray(baseLog.meals?.dinner) ? baseLog.meals.dinner : [],
      snack: Array.isArray(baseLog.meals?.snack) ? baseLog.meals.snack : [],
      nightSnack: Array.isArray(baseLog.meals?.nightSnack) ? baseLog.meals.nightSnack : []
    };

    return { ...baseLog, meals: safeMeals };
  }, [dietLogs, selectedDate]);

  const dailyTotals = useMemo(() => {
    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    if (!currentLog.meals) return totals;

    Object.values(currentLog.meals).forEach((mealList: any) => {
      if (Array.isArray(mealList)) {
        mealList.forEach((m: MealRecord) => {
          totals.calories += Number(m.macros?.calories || 0);
          totals.protein += Number(m.macros?.protein || 0);
          totals.carbs += Number(m.macros?.carbs || 0);
          totals.fat += Number(m.macros?.fat || 0);
        });
      }
    });
    return totals;
  }, [currentLog]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        setNewMealImage(reader.result as string);
        setIsAnalyzing(true);
        try {
          const analysis = await analyzeFoodImage(reader.result as string, profile);
          if (analysis) {
            setNewMealName(analysis.name);
            setNewMealCals(analysis.macros.calories.toString());
            setNewMealP(analysis.macros.protein.toString());
            setNewMealC(analysis.macros.carbs.toString());
            setNewMealF(analysis.macros.fat.toString());
          }
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveMeal = () => {
    if (!newMealName) return;
    const newMeal: MealRecord = {
      id: Date.now().toString(),
      name: newMealName,
      image: newMealImage || undefined,
      timestamp: new Date().toISOString(),
      macros: {
        calories: parseInt(newMealCals) || 0,
        protein: parseInt(newMealP) || 0,
        carbs: parseInt(newMealC) || 0,
        fat: parseInt(newMealF) || 0
      }
    };

    const updatedLog: DietLog = {
      ...currentLog,
      meals: {
        ...currentLog.meals,
        [activeMealType]: [...(currentLog.meals[activeMealType] || []), newMeal]
      }
    };
    onUpdateDietLog(updatedLog);
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setNewMealName(''); setNewMealCals(''); setNewMealP(''); setNewMealC(''); setNewMealF(''); setNewMealImage(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-40">
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-gray-100 pb-8 gap-6">
        <div>
           <p className="text-[11px] font-mono font-black text-gray-500 uppercase tracking-[0.4em] mb-2">Nutritional Deck</p>
           <h2 className="text-4xl md:text-5xl font-black text-black tracking-tighter uppercase leading-none">飲食控制</h2>
        </div>
        <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-full border border-gray-200">
           <button onClick={() => {
             const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]);
           }} className="p-3 hover:bg-white rounded-full transition-all"><ChevronLeft size={18}/></button>
           <span className="font-bold text-base min-w-[120px] text-center">{selectedDate}</span>
           <button onClick={() => {
             const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]);
           }} className="p-3 hover:bg-white rounded-full transition-all"><ChevronRight size={18}/></button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-black text-white p-8 md:p-10 shadow-2xl space-y-6">
            <p className="text-[10px] font-black text-[#bef264] uppercase tracking-widest">Daily Calorie Balance</p>
            <div className="flex items-baseline gap-4">
              <span className="text-6xl font-black tracking-tighter">
                {Math.max(0, (profile.dailyCalorieTarget || 2200) - dailyTotals.calories)}
              </span>
              <span className="text-gray-500 font-bold uppercase text-xs">剩餘熱量</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
               <div className="h-full bg-[#bef264]" style={{ width: `${Math.min(100, (dailyTotals.calories / (profile.dailyCalorieTarget || 2200)) * 100)}%` }}></div>
            </div>
         </div>
         <div className="grid grid-cols-3 gap-4">
            {[
              { label: '蛋白質', value: `${dailyTotals.protein}g`, icon: <Beef size={20}/>, color: 'text-orange-500' },
              { label: '碳水', value: `${dailyTotals.carbs}g`, icon: <Wheat size={20}/>, color: 'text-blue-500' },
              { label: '脂肪', value: `${dailyTotals.fat}g`, icon: <Droplets size={20}/>, color: 'text-yellow-500' },
            ].map((stat, i) => (
              <div key={i} className="bg-white border border-gray-100 p-6 flex flex-col items-center justify-center text-center shadow-sm">
                 <div className={`${stat.color} mb-3`}>{stat.icon}</div>
                 <span className="text-xl font-black text-black">{stat.value}</span>
                 <span className="text-[10px] text-gray-400 font-bold uppercase mt-1">{stat.label}</span>
              </div>
            ))}
         </div>
      </div>

      <div className="space-y-4">
        {Object.entries(MEAL_TYPES).map(([type, meta]) => {
          const mealList = currentLog.meals[type as keyof typeof currentLog.meals] || [];
          const mealCalories = mealList.reduce((s, m) => s + (m.macros?.calories || 0), 0);
          
          return (
            <div key={type} className="bg-white border border-gray-100 rounded-sm shadow-sm hover:border-black/20 transition-all overflow-hidden">
               <div className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-gray-50 text-gray-500 rounded-full">{meta.icon}</div>
                     <div>
                       <h4 className="text-sm font-black text-black">{meta.label}</h4>
                       <p className="text-xs text-gray-400 font-bold mt-1">
                          {mealCalories} kcal
                       </p>
                     </div>
                  </div>
                  <button 
                    onClick={() => { setActiveMealType(type as any); setShowAddModal(true); }}
                    className="w-10 h-10 flex items-center justify-center bg-black text-white hover:bg-[#bef264] hover:text-black rounded-full transition-all"
                  >
                    <Plus size={20} />
                  </button>
               </div>
               {mealList.length > 0 && (
                  <div className="bg-gray-50/50 border-t border-gray-100">
                     {mealList.map(meal => (
                       <div key={meal.id} className="flex items-center justify-between p-4 px-8 border-b last:border-0 border-gray-100 group">
                          <div className="flex items-center gap-4">
                             {meal.image && <img src={meal.image} className="w-10 h-10 object-cover rounded-sm" />}
                             <div>
                                <p className="text-sm font-bold text-gray-800">{meal.name}</p>
                                <p className="text-[10px] text-gray-400 font-mono">P:{meal.macros.protein}g C:{meal.macros.carbs}g F:{meal.macros.fat}g</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <span className="text-sm font-black">{meal.macros.calories} kcal</span>
                             <button onClick={() => {
                               const updatedLog = { 
                                 ...currentLog, 
                                 meals: { 
                                   ...currentLog.meals, 
                                   [type]: mealList.filter(m => m.id !== meal.id) 
                                 } 
                               };
                               onUpdateDietLog(updatedLog);
                             }} className="text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                          </div>
                       </div>
                     ))}
                  </div>
               )}
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg border-4 border-black p-8 space-y-8 animate-in zoom-in duration-300 relative">
              <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black"><X size={24}/></button>
              
              <div className="flex border-b border-gray-100">
                 {['DATABASE', 'CAMERA', 'CUSTOM'].map(m => (
                    <button 
                      key={m} onClick={() => setAddMode(m as any)}
                      className={`flex-1 py-4 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${addMode === m ? 'border-black text-black' : 'border-transparent text-gray-300'}`}
                    >
                      {m === 'DATABASE' ? '資料庫' : m === 'CAMERA' ? 'AI 辨識' : '自定義'}
                    </button>
                 ))}
              </div>

              {isAnalyzing ? (
                 <TacticalLoader type="DIET" title="David 正在解析補給品矩陣" />
              ) : (
                <div className="space-y-6">
                   {addMode === 'CAMERA' && (
                     <div 
                       onClick={() => fileInputRef.current?.click()}
                       className="w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-black transition-all group overflow-hidden"
                     >
                        {newMealImage ? <img src={newMealImage} className="w-full h-full object-cover" /> : (
                           <div className="text-center space-y-2">
                              <Camera className="mx-auto text-gray-300 group-hover:text-black" size={32} />
                              <p className="text-xs font-black text-gray-400">點擊上傳食物照片啟動 AI 辨識</p>
                           </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                     </div>
                   )}

                   {addMode === 'DATABASE' && (
                      <div className="space-y-4">
                         <div className="flex items-center gap-2 bg-gray-50 border p-3">
                            <Search size={18} className="text-gray-400" />
                            <input 
                              placeholder="搜尋現有食物..." 
                              value={searchQuery}
                              onChange={e => setSearchQuery(e.target.value)}
                              className="bg-transparent flex-1 text-sm font-bold outline-none"
                            />
                         </div>
                         <div className="max-h-40 overflow-y-auto space-y-1">
                            {FOOD_DATABASE.filter(f => f.name.includes(searchQuery)).map(f => (
                               <button 
                                 key={f.id} onClick={() => { setNewMealName(f.name); setNewMealCals(f.macros.calories.toString()); setNewMealP(f.macros.protein.toString()); setNewMealC(f.macros.carbs.toString()); setNewMealF(f.macros.fat.toString()); setAddMode('CUSTOM'); }}
                                 className="w-full text-left p-3 text-sm font-bold hover:bg-gray-50 border-b border-gray-50 flex justify-between"
                               >
                                  <span>{f.name}</span>
                                  <span className="text-gray-400">{f.macros.calories} kcal</span>
                               </button>
                            ))}
                         </div>
                      </div>
                   )}

                   <div className="space-y-4">
                      <div className="space-y-1">
                         <label className="text-[10px] font-black text-gray-400 uppercase">食物名稱 Name</label>
                         <input value={newMealName} onChange={e => setNewMealName(e.target.value)} className="w-full bg-gray-50 p-4 text-base font-bold outline-none border-b-2 border-transparent focus:border-black" />
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4">
                         <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase">Kcal</label>
                            <input value={newMealCals} onChange={e => setNewMealCals(e.target.value)} className="w-full bg-gray-50 p-3 font-mono font-black text-center outline-none border-b-2 border-transparent focus:border-black" />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase">P</label>
                            <input value={newMealP} onChange={e => setNewMealP(e.target.value)} className="w-full bg-gray-50 p-3 font-mono font-black text-center outline-none border-b-2 border-transparent focus:border-black" />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase">C</label>
                            <input value={newMealC} onChange={e => setNewMealC(e.target.value)} className="w-full bg-gray-50 p-3 font-mono font-black text-center outline-none border-b-2 border-transparent focus:border-black" />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase">F</label>
                            <input value={newMealF} onChange={e => setNewMealF(e.target.value)} className="w-full bg-gray-50 p-3 font-mono font-black text-center outline-none border-b-2 border-transparent focus:border-black" />
                         </div>
                      </div>
                   </div>

                   <button 
                     onClick={handleSaveMeal}
                     disabled={!newMealName}
                     className="w-full bg-black text-[#bef264] py-5 font-black text-xs tracking-[0.4em] uppercase hover:bg-[#bef264] hover:text-black transition-all shadow-xl disabled:opacity-20"
                   >
                      儲存戰術補給 SAVE MEAL
                   </button>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default NutritionDeck;
