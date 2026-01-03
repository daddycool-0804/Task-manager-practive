// カテゴリ構造の定義
const TaskCategories = {
  "対顧客対応": {
    subcategories: [
      "提案業務",
      "レポートおよび分析",
      "設定サポート",
      "質問対応",
      "フォローアップ",
      "スケジュール調整",
      "見積・契約業務"
    ]
  },
  "事業開発": {
    subcategories: [
      "市場調査",
      "議論・企画会議",
      "企画作成",
      "エージェント開発",
      "パートナーシップ構築"
    ]
  },
  "社内業務": {
    subcategories: [
      "社内報告",
      "レポート作成",
      "経費関連",
      "社内申請",
      "組織運営",
      "知識管理"
    ]
  }
};

// データ保存用のユーティリティ
const TaskStorage = {
  // タスクの保存
  saveTasks(tasks) {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  },
  
  // タスクの取得
  getTasks() {
    return JSON.parse(localStorage.getItem('tasks')) || [];
  },
  
  // 行動ログの保存
  saveActionLog(action) {
    const logs = this.getActionLogs();
    logs.push({
      ...action,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('actionLogs', JSON.stringify(logs));
  },
  
  // 行動ログの取得
  getActionLogs() {
    return JSON.parse(localStorage.getItem('actionLogs')) || [];
  },
  
  // カテゴリ構造を取得
  getCategories() {
    return TaskCategories;
  },
  
  // カスタムカテゴリの保存
  saveCustomCategory(mainCategory, subCategory) {
    const customCategories = this.getCustomCategories();
    
    if (!customCategories[mainCategory]) {
      customCategories[mainCategory] = {
        subcategories: []
      };
    }
    
    if (!customCategories[mainCategory].subcategories.includes(subCategory)) {
      customCategories[mainCategory].subcategories.push(subCategory);
    }
    
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
  },
  
  // カスタムカテゴリの取得
  getCustomCategories() {
    return JSON.parse(localStorage.getItem('customCategories')) || {};
  },
  
  // 全カテゴリ（標準+カスタム）の取得
  getAllCategories() {
    const standardCategories = this.getCategories();
    const customCategories = this.getCustomCategories();
    
    // 標準カテゴリとカスタムカテゴリをマージ
    const allCategories = { ...standardCategories };
    
    Object.keys(customCategories).forEach(mainCategory => {
      if (!allCategories[mainCategory]) {
        allCategories[mainCategory] = { subcategories: [] };
      }
      
      customCategories[mainCategory].subcategories.forEach(subCategory => {
        if (!allCategories[mainCategory].subcategories.includes(subCategory)) {
          allCategories[mainCategory].subcategories.push(subCategory);
        }
      });
    });
    
    return allCategories;
  }
};
