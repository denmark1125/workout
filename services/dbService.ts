
// Use namespace import to resolve environment-specific module resolution issues with Firebase exports
import * as firebaseApp from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';

// Destructure from the namespace to bypass potential missing type exports in certain environments
const { initializeApp, getApps, getApp } = firebaseApp as any;

// 依照指示修正環境變數讀取與預設值
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API || "AIzaSyAdr5J_-sf3Q486Wzmri3gYdOJLC-pMZEE",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "workout-app-20752.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "workout-app-20752",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "workout-app-20752.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "649579159803",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:649579159803:web:886b8bb1e56a0c2dda505e",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-GXX10CEYPK"
};

let app: any;
let db: any;

try {
  const apps = getApps();
  if (firebaseConfig.apiKey) {
    app = apps.length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    console.log("Matrix 資料庫引擎：已連結至雲端節點。");
  } else {
    console.warn("未偵測到資料庫金鑰，系統切換至純本地離線模式。");
  }
} catch (e) {
  console.error("Firebase 初始化失敗:", e);
}

export { db };

/**
 * 強化混合存儲函數 (Local-First + Forced Cloud Sync)
 * 確保數據絕對會存於本地，並在有連線時即時推送至雲端。
 */
export const syncToCloud = async (collectionName: string, data: any, userId: string, enableCloud: boolean = true, cloudDataOverride?: any) => {
  if (!userId) return;

  const localBackupKey = `matrix_backup_${userId}_${collectionName}`;
  const timestamp = new Date().toISOString();

  // 1. 強制保存至本地 (絕對存儲，包含圖片等所有細節)
  try {
    localStorage.setItem(localBackupKey, JSON.stringify({
      data,
      updatedAt: timestamp
    }));
  } catch (e) {
    console.warn(`[本地寫入警告] ${collectionName} 空間受限。`, e);
  }

  // 2. 雲端推送 (若連線正常且允許同步)
  if (!enableCloud || !db) return;

  try {
    const docRef = doc(db, collectionName, userId);
    // 使用過濾後的數據上傳 (例如體態紀錄中不含 Base64 照片，僅存分析文字)
    const payload = cloudDataOverride !== undefined ? cloudDataOverride : data;

    await setDoc(docRef, { 
      data: payload, 
      updatedAt: timestamp, 
      ownerId: userId 
    });
    
    // 註冊表特殊邏輯
    if (collectionName === 'profiles') {
      const registryRef = doc(db, 'system_metadata', 'user_registry');
      await setDoc(registryRef, { [userId]: { 
        memberId: userId, 
        name: data.name, 
        lastActive: timestamp 
      } }, { merge: true });
    }
  } catch (error) {
    console.error(`[雲端同步失敗] ${collectionName}:`, error);
    throw error; // 拋出錯誤供 UI 顯示警告
  }
};

/**
 * 智能獲取函數
 * 同步比對本地與雲端版本，確保數據最新且完整。
 */
export const fetchFromCloud = async (collectionName: string, userId: string) => {
  if (!userId) return null;
  
  let cloudDataObj: any = null;
  let localDataObj: any = null;

  // 讀取本地
  const localRaw = localStorage.getItem(`matrix_backup_${userId}_${collectionName}`);
  if (localRaw) {
    try { localDataObj = JSON.parse(localRaw); } catch(e) {}
  }

  // 讀取雲端
  if (db) {
    try {
      const snap = await getDoc(doc(db, collectionName, userId));
      if (snap.exists()) {
        cloudDataObj = snap.data();
      }
    } catch (e) {
      console.warn(`[雲端讀取異常] ${collectionName}。`);
    }
  }

  // 合併與決策
  if (!cloudDataObj) return localDataObj?.data || null;
  if (!localDataObj) return cloudDataObj.data;

  const localTime = new Date(localDataObj.updatedAt).getTime();
  const cloudTime = new Date(cloudDataObj.updatedAt).getTime();

  // 體態紀錄特殊處理：補回本地照片
  if (collectionName === 'physique' && cloudTime >= localTime) {
    let result = cloudDataObj.data;
    result = result.map((cloudItem: any) => {
      const localMatch = localDataObj.data.find((l: any) => l.id === cloudItem.id);
      return (localMatch && localMatch.image) ? { ...cloudItem, image: localMatch.image } : cloudItem;
    });
    return result;
  }

  return (cloudTime >= localTime) ? cloudDataObj.data : localDataObj.data;
};

export const recordLoginEvent = async (userId: string) => {
  if (!db) return;
  try {
    const logId = `log_${Date.now()}`;
    await setDoc(doc(db, 'auth_logs', logId), { memberId: userId, timestamp: new Date().toISOString() });
  } catch (e) {}
};

export const getAllUsers = async () => {
  if (!db) return {};
  try {
    const snap = await getDoc(doc(db, 'system_metadata', 'user_registry'));
    return snap.exists() ? snap.data() : {};
  } catch (e) { return {}; }
};

export const getAllAuthLogs = async () => {
  if (!db) return [];
  try {
    const querySnapshot = await getDocs(collection(db, "auth_logs"));
    return querySnapshot.docs.map(doc => doc.data());
  } catch (e) { return []; }
};

export const purgeUser = async (userId: string) => {
  if (!db) return;
  const collections = ['profiles', 'metrics', 'logs', 'physique', 'diet', 'reports'];
  for (const col of collections) {
    try { 
      await deleteDoc(doc(db, col, userId)); 
      localStorage.removeItem(`matrix_backup_${userId}_${col}`);
    } catch(e) {}
  }
};
