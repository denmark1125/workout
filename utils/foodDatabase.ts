
import { MacroNutrients, FoodItem } from '../types';

export const FOOD_DATABASE: FoodItem[] = [
  // 台灣常見外食 - 主餐類
  { id: 'f_curry_01', name: '日式咖哩雞肉飯', unit: '1份 (450g)', category: 'STAPLE', macros: { calories: 720, protein: 25, carbs: 95, fat: 28 }, source: '外食矩陣' },
  { id: 'f_beef_noodle', name: '紅燒牛肉麵', unit: '1碗 (600g)', category: 'STAPLE', macros: { calories: 650, protein: 35, carbs: 75, fat: 22 }, source: '外食矩陣' },
  { id: 'f_chicken_rice', name: '台式雞肉飯', unit: '1碗', category: 'STAPLE', macros: { calories: 450, protein: 18, carbs: 65, fat: 12 }, source: '外食矩陣' },
  { id: 'f_pork_rice', name: '滷肉飯 (大)', unit: '1碗', category: 'STAPLE', macros: { calories: 580, protein: 15, carbs: 70, fat: 28 }, source: '外食矩陣' },
  { id: 'f_omurice', name: '蛋包飯', unit: '1份', category: 'STAPLE', macros: { calories: 680, protein: 20, carbs: 85, fat: 25 }, source: '外食矩陣' },
  
  // 超商便利類
  { id: 'f_cvs_01', name: '全家 鮪魚飯糰', unit: '1顆', category: 'CONVENIENCE', macros: { calories: 205, protein: 5, carbs: 42, fat: 2 }, source: '全家便利商店' },
  { id: 'f_cvs_02', name: '7-11 紐奧良雞翅', unit: '1份', category: 'CONVENIENCE', macros: { calories: 220, protein: 18, carbs: 5, fat: 15 }, source: '7-11' },
  { id: 'f_cvs_03', name: '7-11 握便當', unit: '1份', category: 'CONVENIENCE', macros: { calories: 450, protein: 15, carbs: 65, fat: 18 }, source: '7-11' },
  { id: 'f_cvs_04', name: '無糖豆漿 (低溫)', unit: '1瓶 (450ml)', category: 'DRINK', macros: { calories: 150, protein: 15, carbs: 8, fat: 6 }, source: '超商通用' },
  
  // 早餐類
  { id: 'f_brk_01', name: '火腿蛋吐司', unit: '1份', category: 'STAPLE', macros: { calories: 380, protein: 15, carbs: 45, fat: 16 }, source: '早餐店' },
  { id: 'f_brk_02', name: '原味蛋餅', unit: '1份', category: 'STAPLE', macros: { calories: 260, protein: 10, carbs: 25, fat: 14 }, source: '早餐店' },
  { id: 'f_brk_03', name: '中杯冰奶茶', unit: '1杯 (350ml)', category: 'DRINK', macros: { calories: 210, protein: 2, carbs: 35, fat: 8 }, source: '早餐店' },

  // 健身基礎
  { id: 'f_fit_01', name: '即食雞胸肉', unit: '1包 (100g)', category: 'PROTEIN', macros: { calories: 115, protein: 24, carbs: 1, fat: 2 }, source: '健身矩陣' },
  { id: 'f_fit_02', name: '水煮蛋', unit: '1顆', category: 'PROTEIN', macros: { calories: 75, protein: 7, carbs: 0, fat: 5 }, source: '健身矩陣' },
  { id: 'f_fit_03', name: '乳清蛋白粉', unit: '1匙 (30g)', category: 'PROTEIN', macros: { calories: 120, protein: 24, carbs: 3, fat: 1 }, source: '健身矩陣' },
];
