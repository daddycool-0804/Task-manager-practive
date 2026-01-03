// タスク分析ユーティリティ
const TaskAnalyzer = {
  // 週間レビューの生成
  generateWeeklyReview() {
    const tasks = TaskStorage.getTasks();
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // 先週のタスクをフィルタリング
    const lastWeekTasks = tasks.filter(task => {
      const taskDate = new Date(task.completedAt || task.dueDate);
      return taskDate >= oneWeekAgo && taskDate <= now;
    });
    
    if (lastWeekTasks.length === 0) {
      return ["タスクデータがまだ十分にありません。もっとタスクを追加して使い続けてください。"];
    }
    
    // 先延ばしされたタスクの分析
    const postponedTasks = lastWeekTasks.filter(task => task.postponedCount > 0);
    const postponedRatio = lastWeekTasks.length > 0 ? 
      postponedTasks.length / lastWeekTasks.length : 0;
    
    // 緊急度と重要度の分析
    const urgentTasks = lastWeekTasks.filter(task => task.urgency >= 4);
    const importantButNotUrgentTasks = lastWeekTasks.filter(
      task => task.importance >= 4 && task.urgency < 3
    );
    
    // レビューメッセージの生成
    let reviewMessages = [];
    
    if (urgentTasks.length > importantButNotUrgentTasks.length * 2) {
      reviewMessages.push(
        "緊急度が高いタスクばかり取り組んでいます。重要度が高いが緊急度が低いタスクを計画的に進めましょう。"
      );
    }
    
    if (postponedRatio > 0.2) {
      reviewMessages.push(
        `先週は${lastWeekTasks.length}件のタスクのうち、${postponedTasks.length}件が先延ばしされました。先延ばしの原因を考え、改善策を取り入れましょう。`
      );
    }
    
    if (reviewMessages.length === 0) {
      reviewMessages.push("良いペースでタスクを進めています。このまま続けましょう！");
    }
    
    return reviewMessages;
  },
  
  // カテゴリ別の分析を生成
  generateCategoryAnalysis() {
    const tasks = TaskStorage.getTasks();
    const completedTasks = tasks.filter(task => task.status === 'completed');
    
    if (completedTasks.length === 0) {
      return {
        message: ["完了したタスクがないため、カテゴリ分析はできません。"],
        data: {}
      };
    }
    
    // カテゴリ別にタスクをグループ化
    const categoryGroups = {};
    
    completedTasks.forEach(task => {
      if (task.category && task.category.main) {
        const mainCategory = task.category.main;
        
        if (!categoryGroups[mainCategory]) {
          categoryGroups[mainCategory] = [];
        }
        
        categoryGroups[mainCategory].push(task);
      }
    });
    
    // カテゴリ別の分析結果
    const categoryAnalysis = {};
    
    Object.keys(categoryGroups).forEach(category => {
      const categoryTasks = categoryGroups[category];
      
      // 平均所要時間
      const tasksWithBothTimes = categoryTasks.filter(task => task.estimatedTime && task.actualTime);
      let avgTimeDiff = 0;
      
      if (tasksWithBothTimes.length > 0) {
        avgTimeDiff = tasksWithBothTimes.reduce(
          (sum, task) => sum + (task.actualTime - task.estimatedTime), 0
        ) / tasksWithBothTimes.length;
      }
      
      // 先延ばし率
      const postponedCount = categoryTasks.filter(task => task.postponedCount > 0).length;
      const postponedRate = categoryTasks.length > 0 ? postponedCount / categoryTasks.length : 0;
      
      categoryAnalysis[category] = {
        count: categoryTasks.length,
        avgTimeDiff: Math.round(avgTimeDiff),
        postponedRate: Math.round(postponedRate * 100)
      };
    });
    
    // 分析メッセージの生成
    let analysisMessages = [];
    
    Object.keys(categoryAnalysis).forEach(category => {
      const analysis = categoryAnalysis[category];
      
      if (analysis.avgTimeDiff > 15) {
        analysisMessages.push(
          `「${category}」カテゴリのタスクは予想より平均${analysis.avgTimeDiff}分長くかかっています。見積もりを見直しましょう。`
        );
      }
      
      if (analysis.postponedRate > 30) {
        analysisMessages.push(
          `「${category}」カテゴリのタスクは${analysis.postponedRate}%が先延ばしされています。優先度の見直しを検討しましょう。`
        );
      }
    });
    
    if (analysisMessages.length === 0) {
      analysisMessages.push("カテゴリ別の特筆すべき傾向は見られません。");
    }
    
    return {
      message: analysisMessages,
      data: categoryAnalysis
    };
  },
  
  // 緊急度・重要度マトリックスのデータを生成
  generateUrgencyImportanceMatrix() {
    const tasks = TaskStorage.getTasks();
    const activeTasks = tasks.filter(task => 
      task.status === 'pending' || task.status === 'in-progress' || task.status === 'postponed'
    );
    
    // 5x5のマトリックスを初期化（インデックスは1から始まるため6x6）
    const matrix = Array(6).fill().map(() => Array(6).fill(0));
    
    // タスクをマトリックスに配置
    activeTasks.forEach(task => {
      const urgency = task.urgency || 3;
      const importance = task.importance || 3;
      matrix[urgency][importance] = (matrix[urgency][importance] || 0) + 1;
    });
    
    return matrix;
  }
};
