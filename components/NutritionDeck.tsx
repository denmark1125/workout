
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DietLog, MealRecord, MacroNutrients, UserProfile, WorkoutLog } from '../types';
import { analyzeFoodImage } from '../services/geminiService';
import { getTaiwanDate } from '../utils/calculations';
import { FOOD_DATABASE, FoodItem } from '../utils/foodDatabase';
import { Plus, Camera, ChevronLeft, ChevronRight, X, Loader2, Utensils, Flame, Droplets, Beef, Wheat, Sandwich, Moon, Sun, Coffee, Trash2, Search, Database, Scale } from 'lucide-react';

interface NutritionDeckProps {
  dietLogs: DietLog[];
  onUpdateDietLog: (log: DietLog) => void;
  profile: UserProfile;
  workoutLogs: WorkoutLog[];
}

const MEAL_TYPES = {
  breakfast: { label: '早餐 BREAKFAST', icon: <Coffee size={14}/> },
  lunch: { label: '午餐 LUNCH', icon: <Sun size={14}/> },
  dinner: { label: '晚餐 DINNER', icon: <Utensils size={14}/> },
  snack: { label: '點心 SNACK', icon: <Sandwich size={14}/> },
  lateNight: { label: '宵夜 LATE NIGHT', icon: <Moon size={14}/> }
};

const NutritionDeck: React.FC<NutritionDeckProps> = ({ dietLogs, onUpdateDietLog, profile, workoutLogs }) => {
  const [selectedDate, setSelectedDate] = useState(getTaiwanDate());
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeMealType, setActiveMealType] = useState<keyof typeof MEAL_TYPES>('breakfast');
  const [addMode, setAddMode] = useState<'CAMERA' | 'DATABASE'>('DATABASE');
  
  // New Meal Form
  const [newMealName, setNewMealName] = useState('');
  const [newMealCals, setNewMealCals] = useState('');
  const [newMealP, setNewMealP] = useState('');
  const [newMealC, setNewMealC] = useState('');
  const [newMealF, setNewMealF] = useState('');
  const [newMealImage, setNewMealImage] = useState<string | null>(null);
  
  // Base Data for Multiplier Logic (Supports both DB and AI)
  const [baseName, setBaseName] = useState('');
  const [baseMacros, setBaseMacros] = useState<MacroNutrients | null>(null);
  
  // Database Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItem | null>(null);
  const [portionMultiplier, setPortionMultiplier] = useState(1);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentLog = useMemo(() => {
    return dietLogs.find(l => l.date === selectedDate) || {
      id: selectedDate, date: selectedDate,
      meals: { breakfast: [], lunch: [], dinner: [], snack: [], lateNight: [] },
      waterIntake: 0
    };
  }, [dietLogs, selectedDate]);

  const caloriesBurnedToday = useMemo(() => {
    return workoutLogs
      .filter(l => l.date === selectedDate)
      .reduce((sum, log) => sum + (log.totalCaloriesBurned || 0), 0);
  }, [workoutLogs, selectedDate]);

  const dailyTotals = useMemo(() => {
    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const allMeals = Object.values(currentLog.meals).flat() as MealRecord[];
    allMeals.forEach(m => {
      totals.calories += m.macros.calories;
      totals.protein += m.macros.protein;
      totals.carbs += m.macros.carbs;
      totals.fat += m.macros.fat;
    });
    return totals;
  }, [currentLog]);

  const targetCalories = profile.dailyCalorieTarget || 2200;
  const remainingCalories = targetCalories - dailyTotals.calories + caloriesBurnedToday;

  const handleDateChange = (offset: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + offset);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const updateFormValues = (name: string, macros: MacroNutrients, multiplier: number) => {
    const suffix = multiplier !== 1 ? ` (x${multiplier})` : '';
    setNewMealName(`${name}${suffix}`);
    setNewMealCals(Math.round(macros.calories * multiplier).toString());
    setNewMealP(Math.round(macros.protein * multiplier).toString());
    setNewMealC(Math.round(macros.carbs * multiplier).toString());
    setNewMealF(Math.round(macros.fat * multiplier).toString());
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setNewMealImage(compressed);
        setIsAnalyzing(true);
        // Pass profile for quota check
        const analysis = await analyzeFoodImage(compressed, profile);
        setIsAnalyzing(false);
        if (analysis) {
          setBaseName(analysis.name);
          setBaseMacros(analysis.macros);
          setPortionMultiplier(1);
          updateFormValues(analysis.name, analysis.macros, 1);
        } else {
          // Alert handled in analyzeFoodImage for quota, handled here for API failure
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 處理資料庫食物選擇
  const handleSelectFood = (item: FoodItem) => {
    setSelectedFoodItem(item);
    setBaseName(item.name);
    setBaseMacros(item.macros);
    setPortionMultiplier(1);
    updateFormValues(item.name, item.macros, 1);
  };

  const handleMultiplierChange = (m: number) => {
    setPortionMultiplier(m);
    if (baseMacros) {
      updateFormValues(baseName, baseMacros, m);
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
        [activeMealType]: [...currentLog.meals[activeMealType], newMeal]
      }
    };
    onUpdateDietLog(updatedLog);
    resetForm();
    setShowAddModal(false);
  };

  const handleDeleteMeal = (type: keyof typeof MEAL_TYPES, id: string) => {
    if(!confirm("確定刪除此紀錄？")) return;
    const updatedLog: DietLog = {
      ...currentLog,
      meals: {
        ...currentLog.meals,
        [type]: currentLog.meals[type].filter(m => m.id !== id)
      }
    };
    onUpdateDietLog(updatedLog);
  };

  const resetForm = () => {
    setNewMealName(''); setNewMealCals(''); setNewMealP(''); setNewMealC(''); setNewMealF('');
    setNewMealImage(null);
    setSearchQuery('');
    setSelectedFoodItem(null);
    setPortionMultiplier(1);
    setBaseName('');
    setBaseMacros(null);
  };

  const openAddModal = (type: keyof typeof MEAL_TYPES) => {
    setActiveMealType(type);
    resetForm();
    setAddMode('DATABASE'); // Default to DB for convenience
    setShowAddModal(true);
  };

  const filteredFoods = useMemo(() => {
    return FOOD_DATABASE.filter(f => f.name.includes(searchQuery));
  }, [searchQuery]);

  const ProgressBar = ({ label, value, max, color }: { label: string, value: number, max: number, color: string }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-400">
          <span>{label}</span>
          <span>{Math.round(value)} / {max}g</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${percentage}%` }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-32 animate-in fade-in duration-500 px-2 md:px-0">
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-gray-100 pb-8 gap-6">
        <div>
           <p className="text-[10px] font-mono font-black text-gray-500 uppercase tracking-[0.4em] mb-2">Nutritional Control Hub</p>
           <h2 className="text-4xl md:text-5xl font-black text-black tracking-tighter uppercase leading-none">飲食控制中心</h2>
        </div>
        <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-full border border-gray-200">
           <button onClick={() => handleDateChange(-1)} className="p-2 hover:bg-white rounded-full transition-all"><ChevronLeft size={16}/></button>
           <span className="font-mono font-bold text-sm min-w-[100px] text-center">{selectedDate}</span>
           <button onClick={() => handleDateChange(1)} className="p-2 hover:bg-white rounded-full transition-all"><ChevronRight size={16}/></button>
        </div>
      </header>

      {/* Main Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
         {/* Calorie Ring & Summary */}
         <div className="md:col-span-5 bg-black text-white p-8 rounded-sm shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[320px]">
            <div className="absolute top-0 right-0 p-32 bg-[#bef264] blur-[80px] opacity-10 rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#bef264] mb-1">Calorie Balance</p>
              <h3 className="text-5xl font-black tracking-tighter leading-none">{remainingCalories}</h3>
              <p className="text-xs text-gray-400 font-bold uppercase mt-1">剩餘熱量 (Kcal)</p>
            </div>

            <div className="space-y-4 relative z-10">
               <div className="flex justify-between items-center border-b border-white/10 pb-2">
                 <span className="text-[10px] font-black uppercase text-gray-400">Target</span>
                 <span className="font-mono font-bold">{targetCalories}</span>
               </div>
               <div className="flex justify-between items-center border-b border-white/10 pb-2">
                 <span className="text-[10px] font-black uppercase text-gray-400">Eaten</span>
                 <span className="font-mono font-bold text-white">{dailyTotals.calories}</span>
               </div>
               <div className="flex justify-between items-center pb-2">
                 <span className="text-[10px] font-black uppercase text-[#bef264] flex items-center gap-2"><Flame size={12}/> Burned</span>
                 <span className="font-mono font-bold text-[#bef264]">{caloriesBurnedToday}</span>
               </div>
            </div>

            <div className="w-full bg-white/10 h-1 mt-4">
               <div 
                 className="h-full bg-[#bef264] transition-all duration-1000"
                 style={{ width: `${Math.min(100, (dailyTotals.calories / targetCalories) * 100)}%` }}
               ></div>
            </div>
         </div>

         {/* Macros Dashboard */}
         <div className="md:col-span-7 bg-white border border-gray-100 p-8 shadow-sm rounded-sm flex flex-col justify-center space-y-8">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 pb-2">Macronutrient Matrix</h3>
            
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
               <div className="space-y-1">
                  <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-2"><Beef size={18}/></div>
                  <p className="text-xl font-black text-black">{dailyTotals.protein}g</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase">蛋白質 Protein</p>
               </div>
               <div className="space-y-1">
                  <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-2"><Wheat size={18}/></div>
                  <p className="text-xl font-black text-black">{dailyTotals.carbs}g</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase">碳水 Carbs</p>
               </div>
               <div className="space-y-1">
                  <div className="w-10 h-10 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2"><Droplets size={18}/></div>
                  <p className="text-xl font-black text-black">{dailyTotals.fat}g</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase">脂肪 Fat</p>
               </div>
            </div>

            <div className="space-y-4">
              <ProgressBar label="蛋白質 PROTEIN" value={dailyTotals.protein} max={profile.macroTargets?.protein || 150} color="bg-orange-400" />
              <ProgressBar label="碳水化合物 CARBS" value={dailyTotals.carbs} max={profile.macroTargets?.carbs || 200} color="bg-blue-400" />
              <ProgressBar label="脂肪 FAT" value={dailyTotals.fat} max={profile.macroTargets?.fat || 60} color="bg-yellow-400" />
            </div>
         </div>
      </div>

      {/* Meals List */}
      <div className="space-y-4">
        {Object.entries(MEAL_TYPES).map(([type, meta]) => {
          const meals = currentLog.meals[type as keyof typeof MEAL_TYPES];
          const mealCals = meals.reduce((sum, m) => sum + m.macros.calories, 0);
          
          return (
            <div key={type} className="bg-white border border-gray-100 rounded-sm shadow-sm hover:border-black/20 transition-all">
               <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                     <div className="p-2 bg-gray-50 text-gray-500 rounded-full">{meta.icon}</div>
                     <div>
                       <h4 className="text-[11px] font-black uppercase tracking-widest text-black">{meta.label}</h4>
                       <p className="text-[10px] text-gray-400 font-bold mt-0.5">{meals.length} Items • {mealCals} kcal</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => openAddModal(type as keyof typeof MEAL_TYPES)}
                    className="w-8 h-8 flex items-center justify-center bg-black text-white hover:bg-[#bef264] hover:text-black rounded-full transition-all"
                  >
                    <Plus size={16} />
                  </button>
               </div>
               
               {meals.length > 0 && (
                 <div className="border-t border-gray-50 bg-[#fcfcfc]">
                    {meals.map(meal => (
                      <div key={meal.id} className="flex items-center justify-between p-4 px-6 hover:bg-white transition-colors border-b last:border-0 border-gray-50 group">
                         <div className="flex items-center gap-4">
                            {meal.image ? (
                              <img src={meal.image} className="w-10 h-10 object-cover rounded-sm border border-gray-200" alt={meal.name} />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded-sm"><Utensils size={14} className="text-gray-300"/></div>
                            )}
                            <div>
                               <p className="text-sm font-bold text-gray-900">{meal.name}</p>
                               <div className="flex gap-2 text-[9px] text-gray-400 font-mono mt-0.5">
                                  <span>{meal.macros.calories}kcal</span>
                                  <span>P:{meal.macros.protein} C:{meal.macros.carbs} F:{meal.macros.fat}</span>
                                </div>
                            </div>
                         </div>
                         <button onClick={() => handleDeleteMeal(type as any, meal.id)} className="text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={14} />
                         </button>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          );
        })}
      </div>

      {/* Add Meal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6">
           <div className="bg-white w-full max-w-xl md:rounded-sm animate-in slide-in-from-bottom-10 duration-300 border-t-4 border-[#bef264] max-h-[90vh] overflow-y-auto flex flex-col">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10 shrink-0">
                 <h3 className="text-xl font-black uppercase tracking-tight">新增紀錄 (ADD MEAL)</h3>
                 <button onClick={() => setShowAddModal(false)}><X size={20} className="text-gray-400 hover:text-black"/></button>
              </div>

              {/* Mode Toggles */}
              <div className="flex border-b border-gray-100 sticky top-[60px] bg-white z-10">
                 <button 
                   onClick={() => setAddMode('DATABASE')}
                   className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border-b-2 transition-all ${addMode === 'DATABASE' ? 'border-black text-black' : 'border-transparent text-gray-300'}`}
                 >
                    <Database size={14} /> 資料庫搜尋
                 </button>
                 <button 
                   onClick={() => setAddMode('CAMERA')}
                   className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border-b-2 transition-all ${addMode === 'CAMERA' ? 'border-black text-black' : 'border-transparent text-gray-300'}`}
                 >
                    <Camera size={14} /> AI 拍照辨識
                 </button>
              </div>
              
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                 {/* Mode: Database Search */}
                 {addMode === 'DATABASE' && (
                    <div className="space-y-6">
                       <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 p-2 rounded-sm focus-within:border-black transition-all">
                          <Search size={18} className="text-gray-400 ml-2" />
                          <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="搜尋食物 (如: 雞蛋, 地瓜, 拿鐵...)"
                            className="flex-1 bg-transparent p-2 text-sm font-bold outline-none"
                            autoFocus
                          />
                       </div>

                       {/* Quick Chips for Popular Items */}
                       <div className="flex flex-wrap gap-2">
                          {FOOD_DATABASE.slice(0, 5).map(item => (
                             <button key={item.id} onClick={() => handleSelectFood(item)} className="px-3 py-1 bg-gray-100 hover:bg-black hover:text-white rounded-full text-[10px] font-bold transition-all">
                                {item.name}
                             </button>
                          ))}
                       </div>

                       {/* Search Results */}
                       <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar border border-gray-100 p-2 rounded-sm">
                          {filteredFoods.length === 0 ? (
                             <p className="text-center text-[10px] text-gray-400 py-4">無相符結果 / 請輸入關鍵字</p>
                          ) : (
                             filteredFoods.map(item => (
                                <button 
                                  key={item.id} 
                                  onClick={() => handleSelectFood(item)}
                                  className={`w-full flex justify-between items-center p-3 hover:bg-gray-50 text-left rounded-sm transition-all ${selectedFoodItem?.id === item.id ? 'bg-black text-white hover:bg-gray-800' : ''}`}
                                >
                                   <span className="text-sm font-bold">{item.name} <span className="text-[9px] opacity-60 ml-1">{item.unit}</span></span>
                                   <span className="text-[10px] font-mono opacity-80">{item.macros.calories} kcal</span>
                                </button>
                             ))
                          )}
                       </div>
                    </div>
                 )}

                 {/* Mode: Camera AI */}
                 {addMode === 'CAMERA' && (
                     <div 
                       onClick={() => fileInputRef.current?.click()}
                       className="w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-200 hover:border-black cursor-pointer flex flex-col items-center justify-center transition-all group overflow-hidden relative"
                     >
                        {newMealImage ? (
                           <>
                             <img src={newMealImage} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" alt="Preview" />
                             {isAnalyzing && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white backdrop-blur-sm">
                                   <Loader2 className="animate-spin mb-2" size={32} />
                                   <p className="text-[10px] font-black uppercase tracking-widest">AI Analyzing...</p>
                                </div>
                             )}
                           </>
                        ) : (
                           <div className="text-center space-y-2">
                              <Camera className="mx-auto text-gray-300 group-hover:text-black transition-colors" size={32} />
                              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">點擊拍照 / 上傳圖片</p>
                           </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                     </div>
                 )}

                 {/* Common Portion Multiplier (Visible when any food is selected or AI Analyzed) */}
                 {baseMacros && (
                    <div className="space-y-2 p-4 bg-[#fcfcfc] border border-gray-200 rounded-sm border-l-4 border-l-black">
                       <div className="flex justify-between items-center mb-2">
                          <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                             <Scale size={12} /> 份量/份數調整 (PORTION MULTIPLIER)
                          </p>
                          <span className="text-xs font-black bg-black text-[#bef264] px-2 py-0.5 rounded-sm">x{portionMultiplier}</span>
                       </div>
                       <div className="flex justify-between gap-2 overflow-x-auto no-scrollbar">
                          {[0.25, 0.5, 1, 1.5, 2, 3].map(m => (
                             <button 
                               key={m} 
                               onClick={() => handleMultiplierChange(m)}
                               className={`flex-1 min-w-[40px] py-3 text-[10px] font-black border transition-all ${portionMultiplier === m ? 'bg-black text-[#bef264] border-black shadow-md' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}
                             >
                                x{m}
                             </button>
                          ))}
                          <div className="flex items-center border border-gray-200 bg-white px-2 focus-within:border-black transition-all">
                             <span className="text-[10px] font-black text-gray-300 mr-1">自訂</span>
                             <input 
                               type="number" 
                               step="0.1"
                               min="0"
                               value={portionMultiplier}
                               onChange={(e) => handleMultiplierChange(parseFloat(e.target.value) || 0)}
                               className="w-12 py-2 text-[10px] font-black text-center outline-none"
                             />
                          </div>
                       </div>
                       <p className="text-[8px] text-gray-400 font-bold mt-1 text-right">
                          {addMode === 'CAMERA' ? '多人共食時請調整您的攝取比例' : '依據包裝或實際份量調整'}
                       </p>
                    </div>
                 )}

                 {/* Manual Edit Fields (Pre-filled by AI or DB) */}
                 <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">名稱 NAME</label>
                       <input value={newMealName} onChange={e => setNewMealName(e.target.value)} className="w-full bg-gray-50 border-b border-gray-200 p-3 font-bold focus:border-black outline-none" placeholder="例如: 雞胸肉沙拉" />
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2">
                       <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">熱量</label>
                          <input type="number" value={newMealCals} onChange={e => setNewMealCals(e.target.value)} className="w-full bg-gray-50 border-b border-gray-200 p-2 font-mono font-black focus:border-black outline-none text-center" placeholder="0" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-orange-400 tracking-widest">蛋白 P</label>
                          <input type="number" value={newMealP} onChange={e => setNewMealP(e.target.value)} className="w-full bg-gray-50 border-b border-gray-200 p-2 font-mono font-black focus:border-black outline-none text-center" placeholder="0" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-blue-400 tracking-widest">碳水 C</label>
                          <input type="number" value={newMealC} onChange={e => setNewMealC(e.target.value)} className="w-full bg-gray-50 border-b border-gray-200 p-2 font-mono font-black focus:border-black outline-none text-center" placeholder="0" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-yellow-400 tracking-widest">脂肪 F</label>
                          <input type="number" value={newMealF} onChange={e => setNewMealF(e.target.value)} className="w-full bg-gray-50 border-b border-gray-200 p-2 font-mono font-black focus:border-black outline-none text-center" placeholder="0" />
                       </div>
                    </div>
                 </div>

                 <button 
                   onClick={handleSaveMeal}
                   disabled={!newMealName}
                   className="w-full bg-black text-[#bef264] py-4 font-black text-xs tracking-[0.4em] uppercase hover:bg-[#bef264] hover:text-black transition-all shadow-lg disabled:opacity-50"
                 >
                    確認加入 CONFIRM
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default NutritionDeck;
