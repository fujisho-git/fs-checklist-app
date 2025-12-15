import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';

export default function ChecklistHistory({ onSelectChecklist, onEditChecklist, onBackToNew }) {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchDate, setSearchDate] = useState('');
  const [searchInspector, setSearchInspector] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchChecklists();
  }, [currentUser]);

  const fetchChecklists = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const q = query(
        collection(db, 'checklists'),
        where('createdBy', '==', currentUser.email),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const checklistData = [];
      
      querySnapshot.forEach((doc) => {
        checklistData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setChecklists(checklistData);
    } catch (error) {
      console.error('チェックリスト取得エラー:', error.message);
      
      if (error.code === 'permission-denied') {
        alert('チェックリストの取得権限がありません。');
      } else if (error.code === 'failed-precondition') {
        alert('データベースの設定が必要です。管理者に連絡してください。');
      } else {
        alert('チェックリストの取得に失敗しました。');
      }
    }
    setLoading(false);
  };

  const filteredChecklists = checklists.filter(checklist => {
    const dateMatch = searchDate === '' || checklist.date.includes(searchDate);
    const inspectorMatch = searchInspector === '' || 
      (checklist.inspector && checklist.inspector.toLowerCase().includes(searchInspector.toLowerCase()));
    return dateMatch && inspectorMatch;
  });

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

  // 今日の日付かどうか判定
  const isToday = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return dateString === todayStr;
  };

  // 点検ステータスを取得
  const getInspectionStatus = (checklist) => {
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

  const getCompletionStatus = (checklist) => {
    if (!checklist.sections) return { completedStart: 0, completedEnd: 0, totalStart: 0, totalEnd: 0 };
    
    let completedStart = 0;
    let completedEnd = 0;
    let totalStart = 0;  // 始業時チェック対象の項目数
    let totalEnd = 0;    // 終業時チェック対象の項目数
    
    checklist.sections.forEach(section => {
      if (section.title === "特記事項・申し送り事項") return;
      
      if (section.items) {
        section.items.forEach(item => {
          if (item.checks) {
            // 設備個別点検の場合
            item.checks.forEach(check => {
              const checkType = check.checkType || 'both';
              
              // 始業時チェック対象かどうか
              if (checkType === 'start' || checkType === 'both') {
                totalStart++;
                if (check.checkedStart) completedStart++;
              }
              
              // 終業時チェック対象かどうか
              if (checkType === 'end' || checkType === 'both') {
                totalEnd++;
                if (check.checkedEnd) completedEnd++;
              }
            });
          } else {
            // 通常項目の場合
            const checkType = item.checkType || 'both';
            
            // 始業時チェック対象かどうか
            if (checkType === 'start' || checkType === 'both') {
              totalStart++;
              if (item.checkedStart) completedStart++;
            }
            
            // 終業時チェック対象かどうか
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

  if (loading) {
    return <div className="loading">チェックリスト履歴を読み込み中...</div>;
  }

  return (
    <div className="history-container">
      <header className="history-header">
        <div className="header-top">
          <h1>点検履歴</h1>
          <button onClick={onBackToNew} className="new-checklist-button">
            新規点検作成
          </button>
        </div>
        
        <div className="search-filters">
          <div className="filter-group">
            <label>日付で検索:</label>
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="date-filter"
            />
          </div>
          <div className="filter-group">
            <label>点検者で検索:</label>
            <input
              type="text"
              value={searchInspector}
              onChange={(e) => setSearchInspector(e.target.value)}
              placeholder="点検者名を入力"
              className="inspector-filter"
            />
          </div>
          <button onClick={() => { setSearchDate(''); setSearchInspector(''); }} className="clear-filters">
            クリア
          </button>
        </div>
      </header>

      <main className="history-main">
        {filteredChecklists.length === 0 ? (
          <div className="no-results">
            {checklists.length === 0 ? 
              '保存された点検結果がありません。' : 
              '検索条件に一致する点検結果がありません。'
            }
          </div>
        ) : (
          <div className="checklist-grid">
            {filteredChecklists.map((checklist) => {
              const { completedStart, completedEnd, totalStart, totalEnd } = getCompletionStatus(checklist);
              const completionRateStart = totalStart > 0 ? Math.round((completedStart / totalStart) * 100) : 0;
              const completionRateEnd = totalEnd > 0 ? Math.round((completedEnd / totalEnd) * 100) : 0;
              const isTodayChecklist = isToday(checklist.date);
              const inspectionStatus = getInspectionStatus(checklist);
              
              return (
                <div 
                  key={checklist.id} 
                  className={`checklist-card ${isTodayChecklist ? 'today-card' : ''} ${inspectionStatus.className}`}
                  onClick={() => onSelectChecklist(checklist)}
                >
                  {isTodayChecklist && (
                    <div className="today-badge">📅 本日の点検</div>
                  )}
                  <div className="card-header">
                    <h3>{formatDate(checklist.date)}</h3>
                    <div className="inspection-status-badge" data-status={inspectionStatus.status}>
                      {inspectionStatus.label}
                    </div>
                  </div>
                  
                  <div className="card-content">
                    <div className="card-info">
                      <p><strong>点検者:</strong> {checklist.inspector || '-'}</p>
                      <p><strong>天候:</strong> {checklist.weather || '-'}</p>
                    </div>
                    
                    <div className="card-timestamps">
                      <div className="timestamp-item">
                        <span className={`timestamp-label ${checklist.startCompletedAt ? 'completed' : ''}`}>
                          ☀️ 始業時
                        </span>
                        <span className="timestamp-value">
                          {checklist.startCompletedAt 
                            ? new Date(checklist.startCompletedAt).toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'})
                            : '未点検'}
                        </span>
                      </div>
                      <div className="timestamp-item">
                        <span className={`timestamp-label ${checklist.endCompletedAt ? 'completed' : ''}`}>
                          🌙 終業時
                        </span>
                        <span className="timestamp-value">
                          {checklist.endCompletedAt 
                            ? new Date(checklist.endCompletedAt).toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'})
                            : '未点検'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="completion-badges">
                      <div className={`completion-badge ${completionRateStart === 100 ? 'complete' : 'incomplete'}`}>
                        始業 {completionRateStart}%
                      </div>
                      <div className={`completion-badge ${completionRateEnd === 100 ? 'complete' : 'incomplete'}`}>
                        終業 {completionRateEnd}%
                      </div>
                    </div>
                    
                    {checklist.specialNotes && (
                      <div className="card-notes">
                        <p><strong>特記事項:</strong></p>
                        <p className="notes-text">{checklist.specialNotes.substring(0, 100)}
                          {checklist.specialNotes.length > 100 ? '...' : ''}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="card-footer">
                    {isTodayChecklist && !checklist.endCompletedAt && checklist.startCompletedAt ? (
                      <button 
                        className="edit-button continue-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditChecklist(checklist);
                        }}
                      >
                        🌙 終業時点検を続ける
                      </button>
                    ) : (
                      <button 
                        className="edit-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditChecklist(checklist);
                        }}
                      >
                        編集
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
} 