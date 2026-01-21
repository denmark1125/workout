
import * as firebaseApp from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc, addDoc, query, orderBy, limit } from 'firebase/firestore';

const { initializeApp, getApps, getApp } = firebaseApp as any;

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

// --- AI Usage Logging ---
export const logAiTransaction = async (userId: string, model: string, feature: string, status: 'SUCCESS' | 'FAIL' = 'SUCCESS') => {
  if (!db || !userId) return;
  try {
    const usageRef = collection(db, 'ai_usage_logs');
    await addDoc(usageRef, {
      userId,
      model,
      feature,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error("AI Log Error", e);
  }
};

export const getRecentAiLogs = async (limitCount: number = 50) => {
  if (!db) return [];
  try {
    const usageRef = collection(db, 'ai_usage_logs');
    const q = query(usageRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
};

// --- Sync Functions ---
export const syncToCloud = async (collectionName: string, data: any, userId: string, enableCloud: boolean = true, cloudDataOverride?: any) => {
  if (!userId) return;
  const localBackupKey = `matrix_backup_${userId}_${collectionName}`;
  const timestamp = new Date().toISOString();

  try {
    localStorage.setItem(localBackupKey, JSON.stringify({ data, updatedAt: timestamp }));
  } catch (e) {}

  if (!enableCloud || !db) return;
  try {
    const docRef = doc(db, collectionName, userId);
    const payload = cloudDataOverride !== undefined ? cloudDataOverride : data;
    await setDoc(docRef, { data: payload, updatedAt: timestamp, ownerId: userId });
  } catch (error) {
    throw error;
  }
};

export const fetchFromCloud = async (collectionName: string, userId: string) => {
  if (!userId) return null;
  let cloudDataObj: any = null;
  let localDataObj: any = null;
  const localRaw = localStorage.getItem(`matrix_backup_${userId}_${collectionName}`);
  if (localRaw) { try { localDataObj = JSON.parse(localRaw); } catch(e) {} }
  if (db) {
    try {
      const snap = await getDoc(doc(db, collectionName, userId));
      if (snap.exists()) cloudDataObj = snap.data();
    } catch (e) {}
  }
  if (!cloudDataObj) return localDataObj?.data || null;
  if (!localDataObj) return cloudDataObj.data;
  const localTime = new Date(localDataObj.updatedAt).getTime();
  const cloudTime = new Date(cloudDataObj.updatedAt).getTime();
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
