
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, Firestore } from 'firebase/firestore';

// 更新為您提供的新專案配置 (workout-app-20752)
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
  // 安全初始化：如果已經初始化過則拿舊的，否則建立新的
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
} catch (error) {
  console.error("[Matrix Cloud] Firebase 初始化發生錯誤:", error);
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
      source: "The Matrix AI System"
    });
    console.log(`[Matrix Cloud] ${collectionName} 同步成功`);
  } catch (error) {
    console.error(`[Matrix Cloud] ${collectionName} 同步失敗:`, error);
  }
};

export const fetchFromCloud = async (collectionName: string) => {
  if (!db) return null;
  try {
    const docRef = doc(db, collectionName, USER_ID);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data().data : null;
  } catch (error) {
    console.error(`[Matrix Cloud] ${collectionName} 讀取失敗:`, error);
    return null;
  }
};
