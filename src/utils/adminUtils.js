// 管理者のメールアドレスリスト
const ADMIN_EMAILS = [
  'pr.fujisho@gmail.com',  // 管理者のメールアドレスを設定
  // 他の管理者アカウントを追加する場合はここに記述
];

// ユーザーが管理者かどうかを判定
export const isAdmin = (email) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

// 管理者リストを取得（必要に応じて）
export const getAdminEmails = () => {
  return [...ADMIN_EMAILS];
};

// 管理者を追加（開発・テスト用）
export const addAdmin = (email) => {
  if (email && !ADMIN_EMAILS.includes(email.toLowerCase())) {
    ADMIN_EMAILS.push(email.toLowerCase());
    return true;
  }
  return false;
}; 