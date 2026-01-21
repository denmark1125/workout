
import { FoodItem } from '../types';

export const FOOD_DATABASE: FoodItem[] = [
  // --- 台灣超商系列 (7-11 / 全家) ---
  { id: 'cvs_001', name: '鮪魚飯糰', unit: '1個', category: 'CONVENIENCE', macros: { calories: 205, protein: 5, carbs: 42, fat: 2 } },
  { id: 'cvs_002', name: '肉鬆飯糰', unit: '1個', category: 'CONVENIENCE', macros: { calories: 240, protein: 6, carbs: 45, fat: 4 } },
  { id: 'cvs_003', name: '紐奧良雞夾心飯糰', unit: '1個', category: 'CONVENIENCE', macros: { calories: 225, protein: 7, carbs: 44, fat: 3 } },
  { id: 'cvs_004', name: '雞肉紅藜飯糰', unit: '1個', category: 'CONVENIENCE', macros: { calories: 190, protein: 8, carbs: 35, fat: 2 } },
  { id: 'cvs_005', name: '無糖高纖豆漿', unit: '450ml', category: 'DRINK', macros: { calories: 147, protein: 15, carbs: 9, fat: 6 } },
  { id: 'cvs_006', name: '低脂牛奶', unit: '290ml', category: 'DRINK', macros: { calories: 125, protein: 9, carbs: 14, fat: 4 } },
  { id: 'cvs_007', name: '香蕉', unit: '1根', category: 'VEG', macros: { calories: 90, protein: 1, carbs: 23, fat: 0 } },
  { id: 'cvs_008', name: '茶葉蛋', unit: '1顆', category: 'PROTEIN', macros: { calories: 75, protein: 7, carbs: 1, fat: 5 } },
  { id: 'cvs_009', name: '舒迷雞胸肉(法式)', unit: '1份', category: 'PROTEIN', macros: { calories: 110, protein: 23, carbs: 2, fat: 1 } },
  { id: 'cvs_010', name: '大口飯糰(烤雞)', unit: '1個', category: 'CONVENIENCE', macros: { calories: 350, protein: 12, carbs: 55, fat: 9 } },

  // --- 台灣外食與小吃 ---
  { id: 'tw_001', name: '滷肉飯 (小)', unit: '1碗', category: 'STAPLE', macros: { calories: 420, protein: 10, carbs: 65, fat: 15 } },
  { id: 'tw_002', name: '雞肉飯', unit: '1碗', category: 'STAPLE', macros: { calories: 380, protein: 15, carbs: 60, fat: 8 } },
  { id: 'tw_003', name: '紅燒牛肉麵', unit: '1碗', category: 'STAPLE', macros: { calories: 650, protein: 35, carbs: 75, fat: 22 } },
  { id: 'tw_004', name: '排骨便當', unit: '1份', category: 'STAPLE', macros: { calories: 850, protein: 30, carbs: 95, fat: 38 } },
  { id: 'tw_005', name: '雞腿便當', unit: '1份', category: 'STAPLE', macros: { calories: 820, protein: 35, carbs: 90, fat: 35 } },
  { id: 'tw_006', name: '蚵仔煎', unit: '1份', category: 'SNACK', macros: { calories: 510, protein: 15, carbs: 45, fat: 30 } },
  { id: 'tw_007', name: '臭豆腐 (5塊)', unit: '1份', category: 'SNACK', macros: { calories: 480, protein: 18, carbs: 35, fat: 30 } },
  { id: 'tw_008', name: '水餃 (10顆)', unit: '10顆', category: 'STAPLE', macros: { calories: 500, protein: 20, carbs: 55, fat: 22 } },
  { id: 'tw_009', name: '牛肉捲餅', unit: '1份', category: 'STAPLE', macros: { calories: 550, protein: 22, carbs: 50, fat: 28 } },
  { id: 'tw_010', name: '地瓜球 (小份)', unit: '1份', category: 'SNACK', macros: { calories: 350, protein: 1, carbs: 50, fat: 16 } },

  // --- 連鎖速食 (麥當勞/肯德基/摩斯) ---
  { id: 'mcd_001', name: '大麥克', unit: '1個', category: 'STAPLE', macros: { calories: 548, protein: 26, carbs: 46, fat: 28 } },
  { id: 'mcd_002', name: '麥香魚', unit: '1個', category: 'STAPLE', macros: { calories: 327, protein: 14, carbs: 37, fat: 13 } },
  { id: 'mcd_003', name: '麥克雞塊(6塊)', unit: '1份', category: 'SNACK', macros: { calories: 270, protein: 15, carbs: 18, fat: 15 } },
  { id: 'mcd_004', name: '勁辣雞腿堡', unit: '1個', category: 'STAPLE', macros: { calories: 560, protein: 23, carbs: 52, fat: 28 } },
  { id: 'mcd_005', name: '摩斯鱈魚堡', unit: '1個', category: 'STAPLE', macros: { calories: 360, protein: 13, carbs: 38, fat: 17 } },

  // --- 生鮮食材與補給 ---
  { id: 'fit_001', name: '水煮雞胸肉', unit: '100g', category: 'PROTEIN', macros: { calories: 110, protein: 23, carbs: 0, fat: 1 } },
  { id: 'fit_002', name: '烤鮭魚', unit: '100g', category: 'PROTEIN', macros: { calories: 208, protein: 20, carbs: 0, fat: 13 } },
  { id: 'fit_003', name: '地瓜 (中)', unit: '150g', category: 'STAPLE', macros: { calories: 130, protein: 2, carbs: 30, fat: 0 } },
  { id: 'fit_004', name: '乳清蛋白粉', unit: '1份', category: 'PROTEIN', macros: { calories: 120, protein: 24, carbs: 3, fat: 1 } },
  { id: 'fit_005', name: '希臘優格 (無糖)', unit: '100g', category: 'PROTEIN', macros: { calories: 60, protein: 10, carbs: 4, fat: 0 } },
  { id: 'fit_006', name: '糙米飯', unit: '1碗', category: 'STAPLE', macros: { calories: 280, protein: 6, carbs: 60, fat: 2 } },
  { id: 'fit_007', name: '雞蛋 (大)', unit: '1顆', category: 'PROTEIN', macros: { calories: 75, protein: 7, carbs: 1, fat: 5 } },
  { id: 'fit_008', name: '燕麥片', unit: '50g', category: 'STAPLE', macros: { calories: 190, protein: 6, carbs: 33, fat: 3 } },
  { id: 'fit_009', name: '酪梨', unit: '半顆', category: 'VEG', macros: { calories: 160, protein: 2, carbs: 9, fat: 15 } },
  { id: 'fit_010', name: '綜合堅果', unit: '30g', category: 'SNACK', macros: { calories: 180, protein: 5, carbs: 6, fat: 16 } },
];
