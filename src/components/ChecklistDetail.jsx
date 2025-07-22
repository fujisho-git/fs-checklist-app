import { useAuth } from '../contexts/AuthContext';

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
    if (!checklist.sections) return { completed: 0, total: 0 };
    
    let completed = 0;
    let total = 0;
    
    checklist.sections.forEach(section => {
      if (section.items) {
        section.items.forEach(item => {
          if (item.checks) {
            // 設備個別点検の場合
            item.checks.forEach(check => {
              total++;
              if (check.checked) completed++;
            });
          } else {
            // 通常項目の場合
            total++;
            if (item.checked) completed++;
          }
        });
      }
    });
    
    return { completed, total };
  };

  const { completed, total } = getCompletionStatus();
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

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
            <div className={`completion-status ${completionRate === 100 ? 'complete' : 'incomplete'}`}>
              <strong>完了率:</strong> {completionRate}% ({completed}/{total})
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
            
            {section.title === "4. 特記事項・申し送り事項" ? (
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
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="detail-item">
                    {item.checks ? (
                      // 設備個別点検の場合
                      <div className="equipment-detail">
                        <h4>{item.name}</h4>
                        {item.checks.map((check, checkIndex) => (
                          <div key={checkIndex} className="check-detail">
                            <div className="check-status">
                              <span className={`status-indicator ${check.checked ? 'checked' : 'unchecked'}`}>
                                {check.checked ? '✓' : '✗'}
                              </span>
                              <span className="check-text">{check.text}</span>
                            </div>
                            {check.note && (
                              <div className="check-note">
                                <strong>備考:</strong> {check.note}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      // 通常項目の場合
                      <div className="simple-detail">
                        <div className="check-status">
                          <span className={`status-indicator ${item.checked ? 'checked' : 'unchecked'}`}>
                            {item.checked ? '✓' : '✗'}
                          </span>
                          <span className="check-text">{item.text}</span>
                        </div>
                        {item.note && (
                          <div className="check-note">
                            <strong>備考:</strong> {item.note}
                          </div>
                        )}
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