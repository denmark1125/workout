
import { MacroNutrients } from '../types';

export interface FoodItem {
  id: string;
  name: string;
  unit: string; // e.g., "1顆", "100g", "1份"
  macros: MacroNutrients;
  category: 'STAPLE' | 'PROTEIN' | 'VEG' | 'DRINK' | 'SNACK' | 'CONVENIENCE';
}

export const FOOD_DATABASE: FoodItem[] = [
  // 主食
  { id: 'f001', name: '白飯', unit: '1碗 (160g)', category: 'STAPLE', macros: { calories: 280, protein: 5, carbs: 60, fat: 0 } },
  { id: 'f002', name: '地瓜 (蒸)', unit: '1條 (150g)', category: 'STAPLE', macros: { calories: 190, protein: 2, carbs: 45, fat: 0 } },
  { id: 'f003', name: '燕麥片', unit: '1份 (50g)', category: 'STAPLE', macros: { calories: 190, protein: 6, carbs: 33, fat: 4 } },
  { id: 'f004', name: '全麥吐司', unit: '1片', category: 'STAPLE', macros: { calories: 75, protein: 3, carbs: 13, fat: 1 } },
  { id: 'f005', name: '義大利麵 (熟)', unit: '1份 (200g)', category: 'STAPLE', macros: { calories: 300, protein: 10, carbs: 60, fat: 2 } },

  // 蛋白質
  { id: 'f101', name: '水煮蛋/茶葉蛋', unit: '1顆', category: 'PROTEIN', macros: { calories: 75, protein: 7, carbs: 0, fat: 5 } },
  { id: 'f102', name: '雞胸肉 (水煮)', unit: '100g', category: 'PROTEIN', macros: { calories: 110, protein: 23, carbs: 0, fat: 2 } },
  { id: 'f103', name: '牛排 (菲力)', unit: '100g', category: 'PROTEIN', macros: { calories: 180, protein: 20, carbs: 0, fat: 10 } },
  { id: 'f104', name: '鮭魚 (煎)', unit: '100g', category: 'PROTEIN', macros: { calories: 208, protein: 20, carbs: 0, fat: 13 } },
  { id: 'f105', name: '傳統豆腐', unit: '1塊 (100g)', category: 'PROTEIN', macros: { calories: 88, protein: 8, carbs: 2, fat: 5 } },
  { id: 'f106', name: '無糖豆漿', unit: '1杯 (400ml)', category: 'PROTEIN', macros: { calories: 135, protein: 14, carbs: 6, fat: 7 } },
  { id: 'f107', name: '乳清蛋白粉', unit: '1匙 (30g)', category: 'PROTEIN', macros: { calories: 120, protein: 24, carbs: 3, fat: 1 } },

  // 超商/外食
  { id: 'f201', name: '7-11 國民便當', unit: '1份', category: 'CONVENIENCE', macros: { calories: 780, protein: 25, carbs: 90, fat: 35 } },
  { id: 'f202', name: '御飯糰 (鮪魚)', unit: '1顆', category: 'CONVENIENCE', macros: { calories: 200, protein: 5, carbs: 40, fat: 2 } },
  { id: 'f203', name: '茶碗蒸', unit: '1份', category: 'CONVENIENCE', macros: { calories: 80, protein: 6, carbs: 4, fat: 4 } },
  { id: 'f204', name: '拿鐵咖啡 (中)', unit: '1杯', category: 'DRINK', macros: { calories: 150, protein: 8, carbs: 12, fat: 8 } },
  { id: 'f205', name: '全脂牛奶', unit: '1盒 (290ml)', category: 'DRINK', macros: { calories: 190, protein: 9, carbs: 14, fat: 11 } },

  // 蔬果點心
  { id: 'f301', name: '香蕉', unit: '1根', category: 'SNACK', macros: { calories: 105, protein: 1, carbs: 27, fat: 0 } },
  { id: 'f302', name: '蘋果', unit: '1顆', category: 'SNACK', macros: { calories: 95, protein: 0, carbs: 25, fat: 0 } },
  { id: 'f303', name: '綜合堅果', unit: '1把 (30g)', category: 'SNACK', macros: { calories: 180, protein: 6, carbs: 6, fat: 15 } },
  { id: 'f304', name: '燙青菜 (不淋醬)', unit: '1盤', category: 'VEG', macros: { calories: 50, protein: 2, carbs: 10, fat: 0 } },
];
