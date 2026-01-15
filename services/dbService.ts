
// Fix: Ensure modular Firebase v9 initialization functions are correctly imported from '@firebase/app'
// This ensures that named exports like initializeApp are correctly recognized in environments where 'firebase/app' might be mapped incorrectly.
import { initializeApp, getApps, getApp } from '@firebase/app';
import { getFirestore, doc, setDoc, getDoc, Firestore, collection, getDocs, deleteDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAdr5J_-sf3Q486Wzmri3gYdOJLC-pMZEE",
  authDomain: "workout-app-20752.firebaseapp.com",
  projectId: "workout-app-20752",
  storageBucket: "workout-app-20752.firebasestorage.app",
  messagingSenderId: "649579159803",
  appId: "1:649579159803:web:886b8bb1e56a0c2dda505e",
  measurementId: "G-GXX10CEYPK"
};

let db: Firestore | null = null;

try {
  // Fix: Check for existing apps to prevent duplicate initialization error in HMR or multi-render environments
  const apps = getApps();
  const app = apps.length === 0 ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
} catch (error) {
  console.error("[Matrix DB] Init failed:", error);
}

export { db };

// 同步資料至雲端
export const syncToCloud = async (collectionName: string, data: any, userId: string) => {
  if (!db || !userId) return;
  try {
    const docRef = doc(db, collectionName, userId);
    await setDoc(docRef, { 
      data, 
      updatedAt: new Date().toISOString(),
      authorizedBy: userId
    });
    
    // 如果是 Profile，順便註冊到全域用戶表
    if (collectionName === 'profiles') {
      const registryRef = doc(db, 'system_metadata', 'user_registry');
      await setDoc(registryRef, {
        [userId]: {
          memberId: userId,
          lastActive: new Date().toISOString(),
          status: 'ACTIVE'
        }
      }, { merge: true });
    }
  } catch (error) {
    console.error(`[Cloud Error] Sync ${collectionName} failed:`, error);
  }
};

// 提取資料
export const fetchFromCloud = async (collectionName: string, userId: string) => {
  if (!db || !userId) return null;
  try {
    const docRef = doc(db, collectionName, userId);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data().data : null;
  } catch (error) {
    return null;
  }
};

// --- 管理員系統 API ---

/**
 * 紀錄登入行為 (Audit Log)
 */
export const recordLoginEvent = async (userId: string) => {
  if (!db) return;
  try {
    const logId = `log_${Date.now()}`;
    const logRef = doc(db, 'auth_logs', logId);
    await setDoc(logRef, {
      memberId: userId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
    
    // 更新註冊表中的最後活動時間
    const registryRef = doc(db, 'system_metadata', 'user_registry');
    await setDoc(registryRef, {
      [userId]: { lastActive: new Date().toISOString() }
    }, { merge: true });
  } catch (e) {
    console.error("Audit log failed", e);
  }
};

/**
 * 獲取所有註冊用戶 (Admin Only)
 */
export const getAllUsers = async () => {
  if (!db) return {};
  const snap = await getDoc(doc(db, 'system_metadata', 'user_registry'));
  return snap.exists() ? snap.data() : {};
};

/**
 * 獲取所有登入日誌 (Admin Only)
 */
export const getAllAuthLogs = async () => {
  if (!db) return [];
  const querySnapshot = await getDocs(collection(db, "auth_logs"));
  return querySnapshot.docs.map(doc => doc.data()).sort((a: any, b: any) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

/**
 * 抹除特定用戶所有數據 (Admin Only)
 */
export const purgeUser = async (userId: string) => {
  if (!db) return;
  const collections = ['profiles', 'metrics', 'logs', 'physique'];
  for (const col of collections) {
    await deleteDoc(doc(db, col, userId));
  }
  // 從註冊表中移除
  const registryRef = doc(db, 'system_metadata', 'user_registry');
  const snap = await getDoc(registryRef);
  if (snap.exists()) {
    const data = snap.data();
    delete data[userId];
    await setDoc(registryRef, data);
  }
};
