import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// 管理者リストのキャッシュ
let adminCache = null;
let cacheExpiry = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5分間キャッシュ

// デフォルトの管理者（Firestoreが利用できない場合のフォールバック）
const DEFAULT_ADMIN_EMAILS = [
  'pr.fujisho@gmail.com',  // 初期管理者
];

// Firestoreから管理者リストを取得
const fetchAdminsFromFirestore = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'admins'));
    const adminEmails = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email) {
        adminEmails.push(data.email.toLowerCase());
      }
    });
    
    // デフォルト管理者も含める
    const allAdmins = [...new Set([...DEFAULT_ADMIN_EMAILS.map(email => email.toLowerCase()), ...adminEmails])];
    
    // キャッシュを更新
    adminCache = allAdmins;
    cacheExpiry = Date.now() + CACHE_DURATION;
    
    return allAdmins;
  } catch (error) {
    console.error('管理者リスト取得エラー:', error);
    // エラーの場合はデフォルト管理者のみ返す
    return DEFAULT_ADMIN_EMAILS.map(email => email.toLowerCase());
  }
};

// 管理者リストを取得（キャッシュ機能付き）
export const getAdminEmails = async () => {
  // キャッシュが有効な場合はキャッシュを返す
  if (adminCache && cacheExpiry && Date.now() < cacheExpiry) {
    return [...adminCache];
  }
  
  // キャッシュが無効またはない場合はFirestoreから取得
  return await fetchAdminsFromFirestore();
};

// ユーザーが管理者かどうかを判定
export const isAdmin = async (email) => {
  if (!email) return false;
  
  try {
    const adminEmails = await getAdminEmails();
    return adminEmails.includes(email.toLowerCase());
  } catch (error) {
    console.error('管理者判定エラー:', error);
    // エラーの場合はデフォルト管理者のみでチェック
    return DEFAULT_ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase());
  }
};

// キャッシュをクリア（管理者リストが更新された時に呼び出す）
export const clearAdminCache = () => {
  adminCache = null;
  cacheExpiry = null;
};

// 同期版のisAdmin（既存コードとの互換性のため）
export const isAdminSync = (email) => {
  if (!email) return false;
  
  // キャッシュがある場合はキャッシュを使用
  if (adminCache) {
    return adminCache.includes(email.toLowerCase());
  }
  
  // キャッシュがない場合はデフォルト管理者のみでチェック
  return DEFAULT_ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase());
}; 