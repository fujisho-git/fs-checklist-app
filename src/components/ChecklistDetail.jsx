import { useAuth } from '../contexts/AuthContext';

// 丸数字を生成するヘルパー関数
const getCircledNumber = (num) => {
  const circledNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', 
                          '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'];
  return num <= 20 ? circledNumbers[num - 1] : `(${num})`;
};

// テキスト内の特定部分を強調表示するヘルパー関数
const highlightText = (text) => {
  const highlightPattern = '富士商産業エネルギー部(0836-81-1115)';
  if (text.includes(highlightPattern)) {
    const parts = text.split(highlightPattern);
    return (
      <>
        {parts[0]}
        <span className="highlight-red">{highlightPattern}</span>
        {parts[1]}
      </>
    );
  }
  return text;
};

export default function ChecklistDetail({ checklist, onBackToHistory, isFromAdmin = false }) {
  const { logout } = useAuth();

  if (!checklist) {
    return <div className="loading">チェックリストを読み込み中...</div>;
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getCompletionStatus = () => {
    if (!checklist.sections) return { completedStart: 0, completedEnd: 0, totalStart: 0, totalEnd: 0 };
    
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

  const { completedStart, completedEnd, totalStart, totalEnd } = getCompletionStatus();
  const completionRateStart = totalStart > 0 ? Math.round((completedStart / totalStart) * 100) : 0;
  const completionRateEnd = totalEnd > 0 ? Math.round((completedEnd / totalEnd) * 100) : 0;

  // チェック状態を取得するヘルパー関数（旧形式との互換性対応）
  const getCheckStatus = (item, type) => {
    if (type === 'start') {
      return item.checkedStart !== undefined ? item.checkedStart : item.checked;
    } else {
      return item.checkedEnd !== undefined ? item.checkedEnd : item.checked;
    }
  };

  return (
    <div className="detail-container">
      <header className="detail-header">
        <div className="header-top">
          <h1>{checklist.title}</h1>
          <div className="header-buttons">
            <button onClick={onBackToHistory} className="back-button">
              {isFromAdmin ? '管理者画面に戻る' : '履歴に戻る'}
            </button>
            <button onClick={logout} className="logout-button">
              ログアウト
            </button>
          </div>
        </div>
        
        <div className="detail-info">
          <div className="info-row">
            <span><strong>点検日:</strong> {formatDate(checklist.date)}</span>
            <span><strong>天候:</strong> {checklist.weather || '-'}</span>
            <span><strong>点検者:</strong> {checklist.inspector || '-'}</span>
            {isFromAdmin && (
              <span><strong>作成者:</strong> {checklist.createdBy || '-'}</span>
            )}
          </div>
          <div className="completion-rates">
            <div className={`completion-status ${completionRateStart === 100 ? 'complete' : 'incomplete'}`}>
              <strong>始業時完了率:</strong> {completionRateStart}% ({completedStart}/{totalStart})
            </div>
            <div className={`completion-status ${completionRateEnd === 100 ? 'complete' : 'incomplete'}`}>
              <strong>終業時完了率:</strong> {completionRateEnd}% ({completedEnd}/{totalEnd})
            </div>
          </div>
          {checklist.completedAt && (
            <div className="completion-time">
              <strong>作成日時:</strong> {new Date(checklist.completedAt).toLocaleString('ja-JP')}
            </div>
          )}
        </div>
      </header>

      <main className="detail-main">
        {checklist.sections.map((section, sectionIndex) => (
          <section key={sectionIndex} className="detail-section">
            <h2>{section.title}</h2>
            
            {section.title === "特記事項・申し送り事項" ? (
              <div className="special-notes-display">
                {checklist.specialNotes ? (
                  <div className="notes-content">
                    <p>{checklist.specialNotes}</p>
                  </div>
                ) : (
                  <p className="no-notes">特記事項はありません</p>
                )}
              </div>
            ) : (
              <div className="items-list">
                {/* ヘッダー行 */}
                <div className="detail-items-header">
                  <span className="header-text">点検項目</span>
                  <span className="header-checkbox">始業時</span>
                  <span className="header-checkbox">終業時</span>
                  <span className="header-note">備考</span>
                </div>
                
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="detail-item">
                    {item.checks ? (
                      // 設備個別点検の場合
                      <div className="equipment-detail">
                        <h4>{item.name}</h4>
                        {item.checks.map((check, checkIndex) => (
                          <div key={checkIndex} className="check-detail-row">
                            <span className="check-text">
                              <span className="item-number">{getCircledNumber(checkIndex + 1)}</span>
                              {check.text}
                            </span>
                            {(check.checkType === 'start' || check.checkType === 'both' || !check.checkType) ? (
                              <span className={`status-indicator ${getCheckStatus(check, 'start') ? 'checked' : 'unchecked'}`}>
                                {getCheckStatus(check, 'start') ? '✓' : '－'}
                              </span>
                            ) : (
                              <span className="status-indicator disabled">－</span>
                            )}
                            {(check.checkType === 'end' || check.checkType === 'both' || !check.checkType) ? (
                              <span className={`status-indicator ${getCheckStatus(check, 'end') ? 'checked' : 'unchecked'}`}>
                                {getCheckStatus(check, 'end') ? '✓' : '－'}
                              </span>
                            ) : (
                              <span className="status-indicator disabled">－</span>
                            )}
                            <span className="check-note-text">{check.note || '-'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // 通常項目の場合
                      <div className="simple-detail-row">
                        <span className="check-text">
                          <span className="item-number">{getCircledNumber(itemIndex + 1)}</span>
                          {highlightText(item.text)}
                        </span>
                        {(item.checkType === 'start' || item.checkType === 'both' || !item.checkType) ? (
                          <span className={`status-indicator ${getCheckStatus(item, 'start') ? 'checked' : 'unchecked'}`}>
                            {getCheckStatus(item, 'start') ? '✓' : '－'}
                          </span>
                        ) : (
                          <span className="status-indicator disabled">－</span>
                        )}
                        {(item.checkType === 'end' || item.checkType === 'both' || !item.checkType) ? (
                          <span className={`status-indicator ${getCheckStatus(item, 'end') ? 'checked' : 'unchecked'}`}>
                            {getCheckStatus(item, 'end') ? '✓' : '－'}
                          </span>
                        ) : (
                          <span className="status-indicator disabled">－</span>
                        )}
                        <span className="check-note-text">{item.note || '-'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </main>
    </div>
  );
}
