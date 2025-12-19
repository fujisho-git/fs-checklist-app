import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createNewChecklist } from '../data/checklistData';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

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

// カスタム確認モーダルコンポーネント
function ConfirmModal({ isOpen, title, onConfirm, onCancel, isEndOfDay, uncheckedCount }) {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className={`modal-content check-confirm-modal ${isEndOfDay ? 'end-mode' : 'start-mode'}`}>
        <div className="modal-icon">
          {isEndOfDay ? '🌙' : '☀️'}
        </div>
        <div className="modal-mode-badge" data-mode={isEndOfDay ? 'end' : 'start'}>
          {isEndOfDay ? '終業時点検' : '始業時点検'}
        </div>
        <h3 className="modal-title">{title}</h3>
        <div className="unchecked-count-display">
          <span className="count-number">{uncheckedCount}</span>
          <span className="count-label">件</span>
        </div>
        <p className="modal-confirm-text">未チェックのまま保存しますか？</p>
        <div className="modal-buttons">
          <button onClick={onCancel} className="modal-button cancel">
            戻って確認
          </button>
          <button onClick={onConfirm} className={`modal-button confirm ${isEndOfDay ? 'end-mode' : 'start-mode'}`}>
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}

// 結果表示モーダルコンポーネント
function ResultModal({ isOpen, type, message, subMessage, onClose }) {
  if (!isOpen) return null;
  
  const getIcon = () => {
    switch (type) {
      case 'success-start': return '☀️';
      case 'success-end': return '🌙';
      case 'error': return '⚠️';
      default: return '✓';
    }
  };
  
  const isSuccess = type.startsWith('success');
  
  return (
    <div className="modal-overlay">
      <div className={`modal-content result-modal ${type}`}>
        <div className="result-icon">
          {getIcon()}
        </div>
        <h3 className="result-title">{message}</h3>
        {subMessage && (
          <p className="result-message">{subMessage}</p>
        )}
        <button 
          onClick={onClose} 
          className={`result-button ${isSuccess ? 'success' : 'error'}`}
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default function Checklist({ onViewHistory, onViewAdminHistory, currentUser: passedCurrentUser, editChecklist }) {
  const [checklist, setChecklist] = useState(null);
  const [inspector, setInspector] = useState('');
  const [weather, setWeather] = useState('');
  const [saving, setSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [uncheckedCount, setUncheckedCount] = useState(0);
  const [isEndOfDayMode, setIsEndOfDayMode] = useState(false); // 終業時点検モード
  const [showTodayChecklistModal, setShowTodayChecklistModal] = useState(false);
  const [todayChecklist, setTodayChecklist] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultModalData, setResultModalData] = useState({ type: '', message: '', subMessage: '' });
  const [loading, setLoading] = useState(true);
  const { currentUser, isAdminUser, logout } = useAuth();

  // 渡されたcurrentUserを優先して使用（ログイン不要の場合に対応）
  const user = passedCurrentUser || currentUser;

  // 今日の日付を取得（YYYY-MM-DD形式）
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 今日の始業時点検があるかチェック
  const checkTodayChecklist = async () => {
    if (!user?.email) {
      setLoading(false);
      return null;
    }

    try {
      const todayDate = getTodayDate();
      // シンプルなクエリ（インデックス不要）
      const q = query(
        collection(db, 'checklists'),
        where('createdBy', '==', user.email),
        where('date', '==', todayDate)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        // 始業時点検完了済みで、終業時点検未完了のものを探す
        const docs = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(item => item.startCompletedAt && !item.endCompletedAt)
          .sort((a, b) => new Date(b.startCompletedAt) - new Date(a.startCompletedAt));
        
        return docs.length > 0 ? docs[0] : null;
      }
    } catch (error) {
      console.error('今日のチェックリスト取得エラー:', error);
    }
    return null;
  };

  useEffect(() => {
    const initializeChecklist = async () => {
      setLoading(true);
      
      if (editChecklist) {
        // 編集モード：渡されたチェックリストを読み込み
        setChecklist(editChecklist);
        setInspector(editChecklist.inspector || '');
        setWeather(editChecklist.weather || '');
        // 始業時点検完了済みなら終業時モード
        setIsEndOfDayMode(!!editChecklist.startCompletedAt && !editChecklist.endCompletedAt);
        setLoading(false);
      } else {
        // 新規作成モード：今日の始業時点検があるかチェック
        const existingChecklist = await checkTodayChecklist();
        
        if (existingChecklist && existingChecklist.startCompletedAt && !existingChecklist.endCompletedAt) {
          // 今日の始業時点検があり、終業時点検がまだの場合
          setTodayChecklist(existingChecklist);
          setShowTodayChecklistModal(true);
          setLoading(false);
        } else {
          // 新規チェックリストを作成
          const newChecklist = createNewChecklist();
          newChecklist.createdBy = user?.email || 'anonymous';
          setChecklist(newChecklist);
          setInspector('');
          setWeather('');
          setIsEndOfDayMode(false);
          setLoading(false);
        }
      }
    };

    initializeChecklist();
  }, [user, editChecklist]);

  // 今日の始業時点検を読み込む
  const loadTodayChecklist = () => {
    if (todayChecklist) {
      setChecklist(todayChecklist);
      setInspector(todayChecklist.inspector || '');
      setWeather(todayChecklist.weather || '');
      setIsEndOfDayMode(true);
      // 一番上までスクロール
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setShowTodayChecklistModal(false);
  };

  // 新規で始業時点検を開始
  const startNewChecklist = () => {
    const newChecklist = createNewChecklist();
    newChecklist.createdBy = user?.email || 'anonymous';
    setChecklist(newChecklist);
    setInspector('');
    setWeather('');
    setIsEndOfDayMode(false);
    setShowTodayChecklistModal(false);
  };

  const handleItemCheck = (sectionIndex, itemIndex, checkType, checked, note = null) => {
    setChecklist(prev => {
      const updated = { ...prev };
      const item = updated.sections[sectionIndex].items[itemIndex];
      
      if (item.checks) {
        // 設備個別点検の場合は何もしない（個別のhandleEquipmentCheckで処理）
        return prev;
      } else {
        // 通常の項目の場合
        if (checkType === 'start') {
          item.checkedStart = checked;
        } else if (checkType === 'end') {
          item.checkedEnd = checked;
        }
        if (note !== null) {
          item.note = note;
        }
      }
      
      return updated;
    });
  };

  const handleEquipmentCheck = (sectionIndex, itemIndex, checkIndex, checkType, checked, note = null) => {
    setChecklist(prev => {
      const updated = { ...prev };
      const check = updated.sections[sectionIndex].items[itemIndex].checks[checkIndex];
      if (checkType === 'start') {
        check.checkedStart = checked;
      } else if (checkType === 'end') {
        check.checkedEnd = checked;
      }
      if (note !== null) {
        check.note = note;
      }
      return updated;
    });
  };

  const handleSpecialNotes = (notes) => {
    setChecklist(prev => ({ ...prev, specialNotes: notes }));
  };

  // Teams通知を送信する関数（ワークフロー対応）
  const sendTeamsNotification = async (checklistData, isEndOfDay = true) => {
    const teamsWebhookUrl = import.meta.env.VITE_TEAMS_WEBHOOK_URL;
    
    console.log('=== Teams通知デバッグ ===');
    console.log('Webhook URL:', teamsWebhookUrl ? '設定あり' : '設定なし');
    console.log('通知種別:', isEndOfDay ? '終業時' : '始業時');
    
    // Webhook URLが設定されていない場合はスキップ（エラーにはしない）
    if (!teamsWebhookUrl) {
      console.log('Teams Webhook URLが設定されていません（通知スキップ）');
      return;
    }

    try {
      // 未チェック項目をカウント
      const uncheckedItems = checkUncheckedItems();
      const uncheckedCount = uncheckedItems.length;
      
      console.log('送信データ:', {
        inspector: checklistData.inspector,
        date: checklistData.date,
        uncheckedCount: uncheckedCount,
        isEndOfDay: isEndOfDay
      });
      
      // 始業時・終業時で内容を変える
      const title = isEndOfDay ? "🌙 終業時点検が完了しました" : "☀️ 始業時点検が完了しました";
      const completedAt = isEndOfDay ? checklistData.endCompletedAt : checklistData.startCompletedAt;
      const themeColor = isEndOfDay ? "Good" : "Attention"; // 終業時=緑、始業時=黄色
      
      const message = {
        type: "message",
        attachments: [
          {
            contentType: "application/vnd.microsoft.card.adaptive",
            content: {
              type: "AdaptiveCard",
              body: [
                {
                  type: "TextBlock",
                  text: title,
                  size: "large",
                  weight: "bolder",
                  color: themeColor
                },
                {
                  type: "FactSet",
                  facts: [
                    {
                      title: "点検種別:",
                      value: isEndOfDay ? "終業時点検" : "始業時点検"
                    },
                    {
                      title: "点検者:",
                      value: checklistData.inspector
                    },
                    {
                      title: "点検日:",
                      value: checklistData.date
                    },
                    {
                      title: "天候:",
                      value: checklistData.weather || "未入力"
                    },
                    {
                      title: "完了時刻:",
                      value: new Date(completedAt).toLocaleString('ja-JP')
                    },
                    {
                      title: "未チェック項目:",
                      value: uncheckedCount > 0 ? `${uncheckedCount}件 ⚠️` : "なし ✅"
                    }
                  ]
                },
                {
                  type: "TextBlock",
                  text: "特記事項",
                  weight: "bolder",
                  spacing: "medium"
                },
                {
                  type: "TextBlock",
                  text: checklistData.specialNotes || "なし",
                  wrap: true,
                  spacing: "small"
                }
              ],
              actions: [
                {
                  type: "Action.OpenUrl",
                  title: "詳細を確認",
                  url: `${window.location.origin}/#detail-${checklistData.id}`
                }
              ],
              $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
              version: "1.4"
            }
          }
        ]
      };

      console.log('送信するメッセージ:', JSON.stringify(message, null, 2));

      // Teamsワークフローに送信
      const response = await fetch(teamsWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      });

      console.log('レスポンスステータス:', response.status);
      
      const responseText = await response.text();
      console.log('レスポンス本文:', responseText);

      if (!response.ok) {
        throw new Error(`Teams通知の送信に失敗しました: ${response.status} - ${responseText}`);
      }

      console.log('✅ Teams通知を送信しました');
      // alert('Teams通知を送信しました！'); // デバッグ用アラートを削除
    } catch (error) {
      // 通知の失敗はユーザーには表示せず、コンソールにログ出力のみ
      console.error('Teams通知エラー:', error);
    }
  };

  // チェックが入っていない項目があるかチェック（始業時/終業時モードに応じて）
  const checkUncheckedItems = () => {
    const uncheckedItems = [];
    const checkTarget = isEndOfDayMode ? 'end' : 'start';
    
    checklist.sections.forEach((section, sectionIndex) => {
      if (section.title === "特記事項・申し送り事項") return;
      
      section.items.forEach((item, itemIndex) => {
        if (item.checks) {
          // 設備個別点検の場合
          item.checks.forEach((check, checkIndex) => {
            const shouldCheck = checkTarget === 'start' 
              ? (check.checkType === 'start' || check.checkType === 'both')
              : (check.checkType === 'end' || check.checkType === 'both');
            const isChecked = checkTarget === 'start' ? check.checkedStart : check.checkedEnd;
            
            if (shouldCheck && !isChecked) {
              uncheckedItems.push({
                section: section.title,
                item: check.text
              });
            }
          });
        } else {
          // 通常項目の場合
          const shouldCheck = checkTarget === 'start' 
            ? (item.checkType === 'start' || item.checkType === 'both')
            : (item.checkType === 'end' || item.checkType === 'both');
          const isChecked = checkTarget === 'start' ? item.checkedStart : item.checkedEnd;
          
          if (shouldCheck && !isChecked) {
            uncheckedItems.push({
              section: section.title,
              item: item.text
            });
          }
        }
      });
    });
    
    return uncheckedItems;
  };

  // 保存ボタンクリック時の処理
  const handleSaveClick = () => {
    if (!checklist) return;
    
    // チェックが入っていない項目をチェック
    const uncheckedItems = checkUncheckedItems();
    if (uncheckedItems.length > 0) {
      setUncheckedCount(uncheckedItems.length);
      setShowConfirmModal(true);
    } else {
      // 全てチェック済みならそのまま保存
      saveChecklist();
    }
  };

  // 確認後に保存
  const saveChecklist = async () => {
    if (!checklist) return;
    
    setShowConfirmModal(false);
    setSaving(true);
    
    try {
      const now = new Date().toISOString();
      let updatedChecklist = {
        ...checklist,
        inspector,
        weather,
        completedAt: now,
        createdBy: user?.email || 'anonymous'
      };
      
      if (isEndOfDayMode) {
        // 終業時点検モードの場合
        updatedChecklist.endCompletedAt = now;
      } else {
        // 始業時点検の場合
        updatedChecklist.startCompletedAt = now;
      }
      
      await setDoc(doc(db, 'checklists', checklist.id), updatedChecklist);
      setChecklist(updatedChecklist);
      
      if (isEndOfDayMode) {
        // 終業時点検完了時にTeams通知を送信
        await sendTeamsNotification(updatedChecklist, true);
        
        setResultModalData({
          type: 'success-end',
          message: '終業時点検を保存しました',
          subMessage: 'お疲れさまでした！'
        });
        setShowResultModal(true);
      } else {
        // 始業時点検完了時にTeams通知を送信
        await sendTeamsNotification(updatedChecklist, false);
        
        setResultModalData({
          type: 'success-start',
          message: '始業時点検を保存しました',
          subMessage: '終業時に再度アクセスして\n終業時点検を行ってください。'
        });
        setShowResultModal(true);
        // 始業時点検完了後、終業時モードに切り替える
        setIsEndOfDayMode(true);
      }
    } catch (error) {
      console.error('保存エラー:', error);
      if (error.code === 'permission-denied') {
        setResultModalData({
          type: 'error',
          message: '保存に失敗しました',
          subMessage: 'アクセス権限がありません。\nFirebase のセキュリティルールを確認してください。'
        });
      } else {
        setResultModalData({
          type: 'error',
          message: '保存に失敗しました',
          subMessage: 'もう一度お試しください。'
        });
      }
      setShowResultModal(true);
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  // 今日の始業時点検が見つかった場合のモーダル
  if (showTodayChecklistModal && todayChecklist) {
    return (
      <div className="checklist-container">
        <div className="modal-overlay">
          <div className="modal-content today-checklist-modal">
            <h3 className="modal-title">今日の点検が見つかりました</h3>
            <p className="modal-message">
              本日 {todayChecklist.date} の始業時点検が既に登録されています。
              {'\n\n'}
              終業時点検を続けますか？
              それとも新規に始業時点検を開始しますか？
            </p>
            <div className="modal-info">
              <p><strong>点検者:</strong> {todayChecklist.inspector || '未入力'}</p>
              <p><strong>始業時点検:</strong> {todayChecklist.startCompletedAt ? new Date(todayChecklist.startCompletedAt).toLocaleTimeString('ja-JP') : '未完了'}</p>
            </div>
            <div className="modal-buttons">
              <button onClick={startNewChecklist} className="modal-button cancel">
                新規で始業時点検を開始
              </button>
              <button onClick={loadTodayChecklist} className="modal-button confirm end-of-day">
                終業時点検を続ける
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!checklist) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="checklist-container">
      {/* 確認モーダル */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title="未チェック項目があります"
        onConfirm={saveChecklist}
        onCancel={() => setShowConfirmModal(false)}
        isEndOfDay={isEndOfDayMode}
        uncheckedCount={uncheckedCount}
      />
      
      {/* 結果モーダル */}
      <ResultModal
        isOpen={showResultModal}
        type={resultModalData.type}
        message={resultModalData.message}
        subMessage={resultModalData.subMessage}
        onClose={() => {
          setShowResultModal(false);
          if (resultModalData.type === 'success-end') {
            // 終業時点検完了後は履歴画面へ遷移
            window.location.hash = 'history';
          } else if (resultModalData.type === 'success-start') {
            // 始業時点検完了後は一番上までスクロール（終業時モードに切り替わり）
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      />
      
      <header className="checklist-header">
        <div className="header-top">
          <h1>{checklist.title}</h1>
          <div className="header-buttons">
            {user ? (
              <>
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
              </>
            ) : (
              <button onClick={() => window.open('#auth', '_blank')} className="login-button">
                ログイン（履歴確認）
              </button>
            )}
          </div>
        </div>
        
        {isEndOfDayMode ? (
          <div className="editing-notice end-of-day-notice">
            <span className="notice-icon">🌙</span>
            <div className="notice-text">
              <strong>終業時点検モード</strong>
              <span>始業時のデータを読み込みました。<br />終業時のチェックを入力してください。</span>
            </div>
          </div>
        ) : (
          <div className="editing-notice start-of-day-notice">
            <span className="notice-icon">☀️</span>
            <div className="notice-text">
              <strong>始業時点検モード</strong>
              <span>始業時のチェック項目を確認・入力してください。</span>
            </div>
          </div>
        )}
        
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
            
            {section.title === "特記事項・申し送り事項" ? (
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
                {/* ヘッダー行 */}
                <div className="items-header">
                  <span className="header-text">点検項目</span>
                  <span className="header-checkbox">始業時</span>
                  <span className="header-checkbox">終業時</span>
                  <span className="header-note">備考</span>
                </div>
                
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="item">
                    {item.checks ? (
                      // 設備個別点検の場合
                      <div className="equipment-item">
                        <h4>{item.name}</h4>
                        {item.checks.map((check, checkIndex) => (
                          <div key={checkIndex} className="check-item">
                            <span className="item-text">
                              <span className="item-number">{getCircledNumber(checkIndex + 1)}</span>
                              {check.text}
                            </span>
                            <div className="checkbox-group">
                              {(check.checkType === 'start' || check.checkType === 'both') ? (
                                <label className={`checkbox-wrapper ${isEndOfDayMode ? 'disabled' : ''}`} title="始業時">
                                  <input
                                    type="checkbox"
                                    checked={check.checkedStart}
                                    disabled={isEndOfDayMode}
                                    onChange={(e) => handleEquipmentCheck(
                                      sectionIndex, 
                                      itemIndex, 
                                      checkIndex, 
                                      'start',
                                      e.target.checked
                                    )}
                                  />
                                  <span className="checkmark"></span>
                                </label>
                              ) : (
                                <span className="checkbox-placeholder"></span>
                              )}
                              {(check.checkType === 'end' || check.checkType === 'both') ? (
                                <label className={`checkbox-wrapper ${!isEndOfDayMode ? 'disabled' : ''}`} title="終業時">
                                  <input
                                    type="checkbox"
                                    checked={check.checkedEnd}
                                    disabled={!isEndOfDayMode}
                                    onChange={(e) => handleEquipmentCheck(
                                      sectionIndex, 
                                      itemIndex, 
                                      checkIndex, 
                                      'end',
                                      e.target.checked
                                    )}
                                  />
                                  <span className="checkmark"></span>
                                </label>
                              ) : (
                                <span className="checkbox-placeholder"></span>
                              )}
                            </div>
                            <input
                              type="text"
                              value={check.note}
                              onChange={(e) => handleEquipmentCheck(
                                sectionIndex, 
                                itemIndex, 
                                checkIndex, 
                                null,
                                null,
                                e.target.value
                              )}
                              placeholder="備考"
                              className="note-input"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      // 通常の項目の場合
                      <div className="simple-item">
                        <span className="item-text">
                          <span className="item-number">{getCircledNumber(itemIndex + 1)}</span>
                          {highlightText(item.text)}
                        </span>
                        <div className="checkbox-group">
                          {(item.checkType === 'start' || item.checkType === 'both') ? (
                            <label className={`checkbox-wrapper ${isEndOfDayMode ? 'disabled' : ''}`} title="始業時">
                              <input
                                type="checkbox"
                                checked={item.checkedStart}
                                disabled={isEndOfDayMode}
                                onChange={(e) => handleItemCheck(
                                  sectionIndex, 
                                  itemIndex, 
                                  'start',
                                  e.target.checked
                                )}
                              />
                              <span className="checkmark"></span>
                            </label>
                          ) : (
                            <span className="checkbox-placeholder"></span>
                          )}
                          {(item.checkType === 'end' || item.checkType === 'both') ? (
                            <label className={`checkbox-wrapper ${!isEndOfDayMode ? 'disabled' : ''}`} title="終業時">
                              <input
                                type="checkbox"
                                checked={item.checkedEnd}
                                disabled={!isEndOfDayMode}
                                onChange={(e) => handleItemCheck(
                                  sectionIndex, 
                                  itemIndex, 
                                  'end',
                                  e.target.checked
                                )}
                              />
                              <span className="checkmark"></span>
                            </label>
                          ) : (
                            <span className="checkbox-placeholder"></span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={item.note}
                          onChange={(e) => handleItemCheck(
                            sectionIndex, 
                            itemIndex, 
                            null,
                            null,
                            e.target.value
                          )}
                          placeholder="備考"
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
          <div className="button-group">
            <button 
              onClick={handleSaveClick}
              disabled={saving || !inspector.trim()}
              className={`save-button ${isEndOfDayMode ? 'end-of-day' : 'start-of-day'}`}
            >
              {saving ? '保存中...' : (isEndOfDayMode ? '終業時点検を保存' : '始業時点検を保存')}
            </button>
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="scroll-top-button"
              title="ページの先頭に戻る"
            >
              ↑ 上へ
            </button>
          </div>
          {!inspector.trim() && (
            <p className="save-hint">点検者名を入力してから保存してください</p>
          )}
          {checklist.startCompletedAt && !isEndOfDayMode && (
            <p className="save-info">※ この点検は既に始業時点検が登録されています</p>
          )}
        </div>
      </main>
    </div>
  );
}
