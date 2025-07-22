import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createNewChecklist } from '../data/checklistData';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Checklist({ onViewHistory, onViewAdminHistory }) {
  const [checklist, setChecklist] = useState(null);
  const [inspector, setInspector] = useState('');
  const [weather, setWeather] = useState('');
  const [saving, setSaving] = useState(false);
  const { currentUser, isAdminUser, logout } = useAuth();

  useEffect(() => {
    // 新しいチェックリストを作成
    const newChecklist = createNewChecklist();
    newChecklist.createdBy = currentUser?.email;
    setChecklist(newChecklist);
  }, [currentUser]);

  const handleItemCheck = (sectionIndex, itemIndex, checked, note = '') => {
    setChecklist(prev => {
      const updated = { ...prev };
      const item = updated.sections[sectionIndex].items[itemIndex];
      
      if (item.checks) {
        // 設備個別点検の場合は何もしない（個別のhandleEquipmentCheckで処理）
        return prev;
      } else {
        // 通常の項目の場合
        item.checked = checked;
        item.note = note;
      }
      
      return updated;
    });
  };

  const handleEquipmentCheck = (sectionIndex, itemIndex, checkIndex, checked, note = '') => {
    setChecklist(prev => {
      const updated = { ...prev };
      const check = updated.sections[sectionIndex].items[itemIndex].checks[checkIndex];
      check.checked = checked;
      check.note = note;
      return updated;
    });
  };

  const handleSpecialNotes = (notes) => {
    setChecklist(prev => ({ ...prev, specialNotes: notes }));
  };

  const saveChecklist = async () => {
    if (!checklist || !currentUser) return;
    
    setSaving(true);
    try {
      const updatedChecklist = {
        ...checklist,
        inspector,
        weather,
        completedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'checklists', checklist.id), updatedChecklist);
      setChecklist(updatedChecklist);
      alert('チェックリストを保存しました');
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    }
    setSaving(false);
  };

  if (!checklist) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="checklist-container">
      <header className="checklist-header">
        <div className="header-top">
          <h1>{checklist.title}</h1>
          <div className="header-buttons">
            <button onClick={onViewHistory} className="history-button">
              履歴を見る
            </button>
            {isAdminUser && onViewAdminHistory && (
              <button onClick={onViewAdminHistory} className="admin-button">
                管理者画面
              </button>
            )}
            <button onClick={logout} className="logout-button">
              ログアウト
            </button>
          </div>
        </div>
        
        <div className="header-info">
          <div className="info-row">
            <span>点検日: {checklist.date}</span>
            <div className="input-group">
              <label>天候:</label>
              <input
                type="text"
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                placeholder="晴れ/曇り/雨など"
              />
            </div>
            <div className="input-group">
              <label>点検者:</label>
              <input
                type="text"
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
                placeholder="お名前を入力"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="checklist-main">
        {checklist.sections.map((section, sectionIndex) => (
          <section key={sectionIndex} className="checklist-section">
            <h2>{section.title}</h2>
            
            {section.title === "4. 特記事項・申し送り事項" ? (
              <div className="special-notes">
                <textarea
                  value={checklist.specialNotes}
                  onChange={(e) => handleSpecialNotes(e.target.value)}
                  placeholder="特記事項や申し送り事項があれば記入してください"
                  rows="5"
                />
              </div>
            ) : (
              <div className="items-list">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="item">
                    {item.checks ? (
                      // 設備個別点検の場合
                      <div className="equipment-item">
                        <h4>{item.name}</h4>
                        {item.checks.map((check, checkIndex) => (
                          <div key={checkIndex} className="check-item">
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={check.checked}
                                onChange={(e) => handleEquipmentCheck(
                                  sectionIndex, 
                                  itemIndex, 
                                  checkIndex, 
                                  e.target.checked
                                )}
                              />
                              <span className="checkmark"></span>
                              {check.text}
                            </label>
                            <input
                              type="text"
                              value={check.note}
                              onChange={(e) => handleEquipmentCheck(
                                sectionIndex, 
                                itemIndex, 
                                checkIndex, 
                                check.checked, 
                                e.target.value
                              )}
                              placeholder="備考があれば記入"
                              className="note-input"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      // 通常の項目の場合
                      <div className="simple-item">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={(e) => handleItemCheck(
                              sectionIndex, 
                              itemIndex, 
                              e.target.checked
                            )}
                          />
                          <span className="checkmark"></span>
                          {item.text}
                        </label>
                        <input
                          type="text"
                          value={item.note}
                          onChange={(e) => handleItemCheck(
                            sectionIndex, 
                            itemIndex, 
                            item.checked, 
                            e.target.value
                          )}
                          placeholder="備考があれば記入"
                          className="note-input"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
        
        <div className="save-section">
          <button 
            onClick={saveChecklist}
            disabled={saving || !inspector.trim()}
            className="save-button"
          >
            {saving ? '保存中...' : 'チェックリストを保存'}
          </button>
          {!inspector.trim() && (
            <p className="save-hint">点検者名を入力してから保存してください</p>
          )}
        </div>
      </main>
    </div>
  );
} 