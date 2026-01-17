
// Use namespace import to resolve environment-specific module resolution issues with Firebase exports
import * as firebaseApp from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';

// Destructure from the namespace to bypass potential missing type exports in certain environments
const { initializeApp, getApps, getApp } = firebaseApp as any;

const env = (import.meta as any).env || {};

// 1. 修正環境變數讀取方式 (符合 Vite 規範)
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API || "AIzaSyAdr5J_-sf3Q486Wzmri3gYdOJLC-pMZEE",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "workout-app-20752.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "workout-app-20752",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "workout-app-20752.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "649579159803",
  appId: env.VITE_FIREBASE_APP_ID || "1:649579159803:web:886b8bb1e56a0c2dda505e",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-GXX10CEYPK"
};

// Use any for types to resolve environment-specific module resolution issues with Firebase exports
let app: any;
let db: any;

// Initialize Firebase modularly
try {
  const apps = getApps();
  app = apps.length === 0 ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase Initialization Failed", e);
}

export { db };

/**
 * 混合存儲同步函數 (Local-First + Cloud Sync)
 * @param collectionName 集合名稱
 * @param data 要存儲的數據 (完整版，存入本地)
 * @param userId 用戶 ID
 * @param enableCloud 是否允許上傳至雲端
 * @param cloudDataOverride (可選) 若提供，雲端將儲存此數據而非 data (用於移除敏感照片)
 */
export const syncToCloud = async (collectionName: string, data: any, userId: string, enableCloud: boolean = true, cloudDataOverride?: any) => {
  if (!userId) return;

  // --- 1. 本地優先策略 (Local Backup) ---
  // 無論雲端開關為何，先強制寫入本地 LocalStorage 作為絕對備份 (含圖片)
  const localBackupKey = `matrix_backup_${userId}_${collectionName}`;
  const timestamp = new Date().toISOString();

  try {
    localStorage.setItem(localBackupKey, JSON.stringify({
      data, // 這裡永遠存完整版 (含圖片)
      updatedAt: timestamp,
      syncStatus: enableCloud ? 'PENDING' : 'LOCAL_ONLY'
    }));
  } catch (e) {
    console.warn(`[Local Storage] 寫入失敗 (可能空間不足): ${collectionName}`, e);
  }

  // 若用戶關閉雲端同步，則到此為止
  if (!enableCloud) return;

  // --- 2. 雲端同步 (Cloud Sync) ---
  if (!db) {
    console.warn("Firestore 未連線，數據已安全保存在本地。");
    return;
  }

  try {
    const docRef = doc(db, collectionName, userId);
    
    // 決定上傳的 payload：如果有 override (例如去除了圖片的版本)，則用 override
    const payload = cloudDataOverride || data;

    await setDoc(docRef, { 
      data: payload, 
      updatedAt: timestamp, 
      authorizedBy: userId,
      userAgent: navigator.userAgent
    });
    
    // 註冊表邏輯 (僅針對 Profiles)
    if (collectionName === 'profiles') {
      const registryRef = doc(db, 'system_metadata', 'user_registry');
      await setDoc(registryRef, { [userId]: { 
        memberId: userId, 
        name: data.name, 
        role: data.role, 
        lastActive: timestamp, 
        status: 'ACTIVE' 
      } }, { merge: true });
    }
  } catch (error) {
    console.error(`[Cloud Error] ${collectionName} 同步失敗，已保留本地備份:`, error);
  }
};

/**
 * 智能混合讀取函數 (Smart Merge: Local + Cloud)
 * 1. 比較時間戳記，取較新者。
 * 2. 針對 Physique，執行「圖片回補」邏輯。
 */
export const fetchFromCloud = async (collectionName: string, userId: string) => {
  if (!userId) return null;
  
  let cloudDataObj: any = null;
  let localDataObj: any = null;

  // 1. 讀取本地
  const localBackupKey = `matrix_backup_${userId}_${collectionName}`;
  const localRaw = localStorage.getItem(localBackupKey);
  if (localRaw) {
    try {
      localDataObj = JSON.parse(localRaw);
    } catch(e) {}
  }

  // 2. 讀取雲端
  if (db) {
    try {
      const docRef = doc(db, collectionName, userId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        cloudDataObj = snap.data();
      }
    } catch (error) {
      console.warn(`[Cloud Fetch] ${collectionName} 讀取失敗`, error);
    }
  }

  // 3. 決策邏輯 (Smart Decision)
  
  // A. 只有本地數據
  if (localDataObj && !cloudDataObj) return localDataObj.data;
  
  // B. 只有雲端數據
  if (!localDataObj && cloudDataObj) return cloudDataObj.data;
  
  // C. 兩者皆無
  if (!localDataObj && !cloudDataObj) return null;

  // D. 兩者皆有 -> 比較時間
  const localTime = new Date(localDataObj.updatedAt).getTime();
  const cloudTime = new Date(cloudDataObj.updatedAt).getTime();
  
  // 判斷贏家
  let winnerData = (localTime >= cloudTime) ? localDataObj.data : cloudDataObj.data;

  // --- 特殊邏輯：Physique 圖片回補 ---
  // 如果雲端數據是贏家 (較新)，但它沒有圖片 (因為我們上傳時剝離了)，
  // 而本地舊數據有圖片，我們應該把圖片補回來，而不是讓它變成空白。
  if (collectionName === 'physique' && localTime < cloudTime) {
     // Cloud win, but might lack images.
     const mergedData = winnerData.map((cloudItem: any) => {
        if (!cloudItem.image) {
           // 嘗試從本地找對應 ID 的圖片
           const localMatch = localDataObj.data.find((l: any) => l.id === cloudItem.id);
           if (localMatch && localMatch.image) {
              return { ...cloudItem, image: localMatch.image };
           }
        }
        return cloudItem;
     });
     return mergedData;
  }

  return winnerData;
};

export const recordLoginEvent = async (userId: string) => {
  if (!db) return;
  try {
    const logId = `log_${Date.now()}`;
    await setDoc(doc(db, 'auth_logs', logId), { memberId: userId, timestamp: new Date().toISOString(), userAgent: navigator.userAgent });
    await setDoc(doc(db, 'system_metadata', 'user_registry'), { [userId]: { lastActive: new Date().toISOString() } }, { merge: true });
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
    return querySnapshot.docs.map(doc => doc.data()).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (e) { return []; }
};

export const purgeUser = async (userId: string) => {
  if (!db) return;
  const collections = ['profiles', 'metrics', 'logs', 'physique', 'diet'];
  for (const col of collections) {
    try { 
      await deleteDoc(doc(db, col, userId)); 
      // 也清除本地備份
      localStorage.removeItem(`matrix_backup_${userId}_${col}`);
    } catch(e) {}
  }
};
