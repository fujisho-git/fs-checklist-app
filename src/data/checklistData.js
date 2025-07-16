export const checklistTemplate = {
  "title": "石油コークス篩い分け設備 毎日の作業前点検チェックシート",
  "header_info": "点検日: ______年______月______日 天候: 点検者: ______________",
  "sections": [
    {
      "title": "1. 作業開始前の安全確認",
      "items": [
        "稼働エリアは明確にされ、安全が確保されているか？",
        "作業員間で十分な打ち合わせを行い、安全な運転手順を確認したか？",
        "連絡方法（復唱確認など）は全員で周知・確認済みか？",
        "重機と作業員の作業エリアは分離され、連絡・合図の方法は確認済みか？"
      ]
    },
    {
      "title": "2. 設備全体の共通点検",
      "items": [
        "各設備の本体・構造体に、亀裂、損傷、変形がないか？",
        "各設備の接合部のピン、ボルト類に脱落やゆるみがないか？"
      ]
    },
    {
      "title": "3. 各設備の個別点検",
      "items": [
        {
          "name": "動力制御盤",
          "checks": [
            "盤本体に亀裂、損傷、変形、ボルトのゆるみはないか？",
            "扉面の表示灯は正常に点灯・表示されているか？",
            "盤内から異臭、異音、または異常な発熱はないか？",
            "動力電源、スイッチ類は正常な状態か？"
          ]
        },
        {
          "name": "ベルトフィーダ",
          "checks": [
            "モーター、軸受けから異臭、異音、異常な振動、発熱はないか？"
          ]
        },
        {
          "name": "ベルトコンベア",
          "checks": [
            "モーター、軸受けから異臭、異音、異常な振動、発熱はないか？",
            "各シュートに原料が付着していないか？（必要に応じ清掃）",
            "（清掃時）シュート内部に異常はないか？"
          ]
        },
        {
          "name": "ジャンピング",
          "checks": [
            "本体から異臭、異音、異常な振動、発熱はないか？"
          ]
        },
        {
          "name": "スクリーン",
          "checks": [
            "スクリーンマットに原料が付着していないか？（必要に応じ清掃）",
            "スクリーンマットに摩耗や破損などの異常はないか？"
          ]
        },
        {
          "name": "解砕機",
          "checks": [
            "本体から異臭、異音、異常な発熱はないか？",
            "内部に原料が付着していないか？（必要に応じ清掃）",
            "破砕歯に摩耗や破損などの異常はないか？（目視点検）"
          ]
        },
        {
          "name": "ロールブレーカー",
          "checks": [
            "本体から異臭、異音、異常な発熱はないか？",
            "内部に原料が付着していないか？（必要に応じ清掃）",
            "破砕歯に摩耗や破損などの異常はないか？（目視点検）"
          ]
        }
      ]
    },
    {
      "title": "4. 特記事項・申し送り事項",
      "items": []
    }
  ]
};

// 新しいチェックリストインスタンスを作成する関数
export function createNewChecklist() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  return {
    id: `checklist_${Date.now()}`,
    date: `${year}-${month}-${day}`,
    title: checklistTemplate.title,
    header_info: `点検日: ${year}年${month}月${day}日 天候: _____ 点検者: ______________`,
    sections: checklistTemplate.sections.map(section => ({
      ...section,
      items: section.items.map(item => {
        if (typeof item === 'string') {
          return {
            id: `item_${Date.now()}_${Math.random()}`,
            text: item,
            checked: false,
            note: ''
          };
        } else {
          return {
            ...item,
            checks: item.checks.map(check => ({
              id: `check_${Date.now()}_${Math.random()}`,
              text: check,
              checked: false,
              note: ''
            }))
          };
        }
      })
    })),
    specialNotes: '',
    completedAt: null,
    createdBy: null
  };
} 