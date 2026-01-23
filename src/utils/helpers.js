// 丸数字を生成するヘルパー関数
export const getCircledNumber = (num) => {
  const circledNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', 
                          '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'];
  return num <= 20 ? circledNumbers[num - 1] : `(${num})`;
};

// 日付フォーマット関数
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// 今日の日付を取得（YYYY-MM-DD形式）
export const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 今日の日付かどうか判定
export const isToday = (dateString) => {
  if (!dateString) return false;
  return dateString === getTodayDate();
};

// チェックリストの完了状態を計算
export const getCompletionStatus = (checklist) => {
  if (!checklist?.sections) return { completedStart: 0, completedEnd: 0, totalStart: 0, totalEnd: 0 };
  
  let completedStart = 0;
  let completedEnd = 0;
  let totalStart = 0;
  let totalEnd = 0;
  
  checklist.sections.forEach(section => {
    if (section.title === "特記事項・申し送り事項") return;
    
    if (section.items) {
      section.items.forEach(item => {
        if (item.checks) {
          // 設備個別点検の場合
          item.checks.forEach(check => {
            const checkType = check.checkType || 'both';
            
            if (checkType === 'start' || checkType === 'both') {
              totalStart++;
              if (check.checkedStart) completedStart++;
            }
            
            if (checkType === 'end' || checkType === 'both') {
              totalEnd++;
              if (check.checkedEnd) completedEnd++;
            }
          });
        } else {
          // 通常項目の場合
          const checkType = item.checkType || 'both';
          
          if (checkType === 'start' || checkType === 'both') {
            totalStart++;
            if (item.checkedStart) completedStart++;
          }
          
          if (checkType === 'end' || checkType === 'both') {
            totalEnd++;
            if (item.checkedEnd) completedEnd++;
          }
        }
      });
    }
  });
  
  return { completedStart, completedEnd, totalStart, totalEnd };
};

// 点検ステータスを取得
export const getInspectionStatus = (checklist) => {
  const hasStart = !!checklist.startCompletedAt;
  const hasEnd = !!checklist.endCompletedAt;
  
  if (hasStart && hasEnd) {
    return { status: 'completed', label: '完了', className: 'status-completed' };
  } else if (hasStart && !hasEnd) {
    return { status: 'in-progress', label: '終業待ち', className: 'status-in-progress' };
  } else {
    return { status: 'pending', label: '未完了', className: 'status-pending' };
  }
};






