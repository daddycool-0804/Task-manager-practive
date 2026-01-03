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
  }
};
