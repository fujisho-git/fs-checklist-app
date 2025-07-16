import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';

export default function ChecklistHistory({ onSelectChecklist, onBackToNew }) {
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
      console.log('チェックリスト取得開始:', currentUser.email);
      
      const q = query(
        collection(db, 'checklists'),
        where('createdBy', '==', currentUser.email),
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
      console.error('チェックリスト取得エラー詳細:', error);
      console.error('エラーコード:', error.code);
      console.error('エラーメッセージ:', error.message);
      
      if (error.code === 'permission-denied') {
        alert('チェックリストの取得権限がありません。Firestoreのセキュリティルールを確認してください。');
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

  const getCompletionStatus = (checklist) => {
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
              const { completed, total } = getCompletionStatus(checklist);
              const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
              
              return (
                <div 
                  key={checklist.id} 
                  className="checklist-card"
                  onClick={() => onSelectChecklist(checklist)}
                >
                  <div className="card-header">
                    <h3>{formatDate(checklist.date)}</h3>
                    <div className={`completion-badge ${completionRate === 100 ? 'complete' : 'incomplete'}`}>
                      {completionRate}%
                    </div>
                  </div>
                  
                  <div className="card-content">
                    <div className="card-info">
                      <p><strong>点検者:</strong> {checklist.inspector || '-'}</p>
                      <p><strong>天候:</strong> {checklist.weather || '-'}</p>
                      <p><strong>完了項目:</strong> {completed}/{total}</p>
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