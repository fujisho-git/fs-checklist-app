import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminHistory({ onSelectChecklist, onBackToNew, onViewAdminManagement }) {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchDate, setSearchDate] = useState('');
  const [searchInspector, setSearchInspector] = useState('');
  const [searchCreatedBy, setSearchCreatedBy] = useState('');
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    fetchAllChecklists();
  }, [currentUser]);

  const fetchAllChecklists = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      console.log('管理者用チェックリスト取得開始');
      
      // 全ユーザーのチェックリストを取得（createdByフィルタなし）
      const q = query(
        collection(db, 'checklists'),
        orderBy('date', 'desc')
      );
      
      console.log('Firestoreクエリ実行中...');
      const querySnapshot = await getDocs(q);
      console.log('クエリ結果:', querySnapshot.size, '件');
      
      const checklistData = [];
      
      querySnapshot.forEach((doc) => {
        console.log('ドキュメント:', doc.id, doc.data());
        checklistData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('取得完了:', checklistData.length, '件');
      setChecklists(checklistData);
    } catch (error) {
      console.error('管理者用チェックリスト取得エラー詳細:', error);
      console.error('エラーコード:', error.code);
      console.error('エラーメッセージ:', error.message);
      
      if (error.code === 'permission-denied') {
        alert('チェックリストの取得権限がありません。管理者権限を確認してください。');
      } else if (error.code === 'failed-precondition') {
        alert('Firestoreのインデックスが不足しています。Firebase Consoleでインデックスを作成してください。');
      } else {
        alert(`チェックリストの取得に失敗しました: ${error.message}`);
      }
    }
    setLoading(false);
  };

  const filteredChecklists = checklists.filter(checklist => {
    const dateMatch = searchDate === '' || checklist.date.includes(searchDate);
    const inspectorMatch = searchInspector === '' || 
      (checklist.inspector && checklist.inspector.toLowerCase().includes(searchInspector.toLowerCase()));
    const createdByMatch = searchCreatedBy === '' ||
      (checklist.createdBy && checklist.createdBy.toLowerCase().includes(searchCreatedBy.toLowerCase()));
    return dateMatch && inspectorMatch && createdByMatch;
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

  const getCompletionStatus = (checklist) => {
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

  if (loading) {
    return <div className="loading">全チェックリスト履歴を読み込み中...</div>;
  }

  return (
    <div className="history-container">
      <header className="history-header">
        <div className="header-top">
          <h1>管理者画面 - 全ユーザー点検履歴</h1>
          <div className="header-buttons">
            <button onClick={onBackToNew} className="new-checklist-button">
              新規点検作成
            </button>
            {onViewAdminManagement && (
              <button onClick={onViewAdminManagement} className="admin-management-button">
                管理者管理
              </button>
            )}
            <button onClick={logout} className="logout-button">
              ログアウト
            </button>
          </div>
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
          <div className="filter-group">
            <label>作成者で検索:</label>
            <input
              type="text"
              value={searchCreatedBy}
              onChange={(e) => setSearchCreatedBy(e.target.value)}
              placeholder="メールアドレスを入力"
              className="inspector-filter"
            />
          </div>
          <button onClick={() => { setSearchDate(''); setSearchInspector(''); setSearchCreatedBy(''); }} className="clear-filters">
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
              
              return (
                <div 
                  key={checklist.id} 
                  className="checklist-card admin-card"
                  onClick={() => onSelectChecklist(checklist)}
                >
                  <div className="card-header">
                    <h3>{formatDate(checklist.date)}</h3>
                    <div className="completion-badges">
                      <div className={`completion-badge ${completionRateStart === 100 ? 'complete' : 'incomplete'}`}>
                        始業 {completionRateStart}%
                      </div>
                      <div className={`completion-badge ${completionRateEnd === 100 ? 'complete' : 'incomplete'}`}>
                        終業 {completionRateEnd}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-content">
                    <div className="card-info">
                      <p><strong>点検者:</strong> {checklist.inspector || '-'}</p>
                      <p><strong>天候:</strong> {checklist.weather || '-'}</p>
                      <p><strong>作成者:</strong> {checklist.createdBy || '-'}</p>
                      <p><strong>始業時:</strong> {completedStart}/{total} <strong>終業時:</strong> {completedEnd}/{total}</p>
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
                    <small>作成: {checklist.completedAt ? 
                      new Date(checklist.completedAt).toLocaleString('ja-JP') : 
                      '未完了'
                    }</small>
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