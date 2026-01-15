
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, Firestore } from 'firebase/firestore';

// 修正：使用 process.env 替代 import.meta.env 以解決 TypeScript 報錯並統一環境變數存取方式
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

let db: Firestore | null = null;

try {
  // 檢查變數是否成功讀取（Vercel 部署時請確保已在 Settings -> Environment Variables 設定這些變數）
  if (firebaseConfig.apiKey) {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    console.log("[Matrix DB] Firebase connected.");
  } else {
    console.warn("[Matrix DB] Missing API Key. Local fallback active.");
  }
} catch (error) {
  console.error("[Matrix DB] Init failed:", error);
}

export { db };

const USER_ID = "operator_01";

export const syncToCloud = async (collectionName: string, data: any) => {
  if (!db) return;
  try {
    const docRef = doc(db, collectionName, USER_ID);
    await setDoc(docRef, { 
      data, 
      updatedAt: new Date().toISOString(),
      client: "The Matrix System Core"
    });
  } catch (error) {
    console.error(`[Cloud] Sync error:`, error);
  }
};

export const fetchFromCloud = async (collectionName: string) => {
  if (!db) return null;
  try {
    const docRef = doc(db, collectionName, USER_ID);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data().data : null;
  } catch (error) {
    console.error(`[Cloud] Fetch error:`, error);
    return null;
  }
};
