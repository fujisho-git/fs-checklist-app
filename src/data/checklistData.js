export const checklistTemplate = {
  "title": "石油コークス篩い分け設備\n点検チェックシート",
  "sections": [
    {
      "title": "1) 施設全体の運転前準備項目",
      "items": [
        { "text": "発電機、動力制御盤、動力電源、スイッチ類がOFFになっているか、必ず確認してください。", "checkType": "both" },
        { "text": "作業者の保護具を選定（ヘルメット、安全靴、粉塵防止マスク、保護メガネ、巻込み防止は必須です。）", "checkType": "start" },
        { "text": "人員単独運転する際、安全を十分確保した状況で機器を運転してください。", "checkType": "start" },
        { "text": "重機優先で操業を行います。重機、歩行者分離を十分行うとともに連絡合図を十分に行ってください。", "checkType": "start" },
        { "text": "ヤード内、設備テントハウス内、ホッパー内、異物、ボルト等、鉄片、無いか確認、除去。", "checkType": "both" }
      ]
    },
    {
      "title": "2) 発電機",
      "items": [
        { "text": "燃料残量確認、少なければ、富士商産業エネルギー部(0836-81-1115)へ連絡。", "checkType": "start" },
        { "text": "作業場内に人がいない事、動力制御盤の元電源がOFFであることを確認、その上で運転スイッチをONする。", "checkType": "both" }
      ]
    },
    {
      "title": "3) 動力制御盤",
      "items": [
        { "text": "扉面の表示灯に異常がないことを確認。", "checkType": "both" },
        { "text": "盤内を確認、異臭、異音、発熱が無いことを確認。", "checkType": "both" }
      ]
    },
    {
      "title": "4) 原料フィーダ、塊フィーダ",
      "items": [
        { "text": "亀裂、損傷、変形及びボルト類の脱落、ゆるみ等異常がないことを確認。", "checkType": "both" },
        { "text": "始業、終業点検にて各シュート、ホッパー、ロストルの付着清掃、内部点検。その際には電源は絶対に入れないで下さい。", "checkType": "both" }
      ]
    },
    {
      "title": "5) ベルトコンベア",
      "items": [
        { "text": "ベルトおよび機械の亀裂、損傷、変形及びボルト類の脱落、ゆるみ等異常がないことを確認。", "checkType": "both" },
        { "text": "製品テント倉庫内への排出シューター、排出可能かどうか、安全確認。", "checkType": "both" },
        { "text": "始業、終業点検にて各シュートの付着清掃、内部点検。その際には電源は絶対に入れないで下さい。", "checkType": "both" }
      ]
    },
    {
      "title": "6) ジャンピングスクリーン",
      "items": [
        { "text": "亀裂、損傷、変形及びボルト類の脱落、ゆるみ等異常がないことを確認。", "checkType": "both" },
        { "text": "始業、終業点検にて付着清掃。スクリーンの破損、割れが無いか点検。その際には電源は絶対に入れないで下さい。", "checkType": "both" },
        { "text": "スクリーン下部ホッパーの点検口(2ヵ所)。製品の詰まりが無いか、ホッパー内をライトで確認。付着があれば器具で突いて落とす。", "checkType": "both" }
      ]
    },
    {
      "title": "7) 解砕機",
      "items": [
        { "text": "亀裂、損傷、変形及びボルト類の脱落、ゆるみ等異常がないことを確認。", "checkType": "both" },
        { "text": "始業、終業点検で付着清掃、破砕歯の目視点検。その際には電源は絶対に入れないで下さい。", "checkType": "both" }
      ]
    },
    {
      "title": "8) ロールブレイカー",
      "items": [
        { "text": "亀裂、損傷、変形及びボルト類の脱落、ゆるみ等異常がないことを確認。", "checkType": "both" },
        { "text": "始業、終業点検で付着清掃、破砕歯の目視点検。その際には電源は絶対に入れないで下さい。", "checkType": "both" }
      ]
    },
    {
      "title": "9) 製品テント倉庫、製品ヤード",
      "items": [
        { "text": "製品石油コークス、目視点検、製品粒度、大塊飛込み、確認。異物、ごみ除去、設備稼働中、作業員以外進入禁止。", "checkType": "both" }
      ]
    },
    {
      "title": "10) ヤード、篩い機テント倉庫、製品テント倉庫　清掃",
      "items": [
        { "text": "製品ヤードから、敷地内への原料の散乱、こぼれ品を回収し、原料ヤードへ戻す。", "checkType": "both" },
        { "text": "始業前、もしくは終業後、篩い機テント倉庫内、製品テント倉庫内の、飛散した製品の回収、清掃。", "checkType": "both" }
      ]
    },
    {
      "title": "特記事項・申し送り事項",
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
    sections: checklistTemplate.sections.map(section => ({
      ...section,
      items: section.items.map(item => ({
        id: `item_${Date.now()}_${Math.random()}`,
        text: item.text,
        checkType: item.checkType || 'both',
        checkedStart: false,
        checkedEnd: false,
        note: ''
      }))
    })),
    specialNotes: '',
    completedAt: null,
    startCompletedAt: null,
    endCompletedAt: null,
    createdBy: null
  };
}
