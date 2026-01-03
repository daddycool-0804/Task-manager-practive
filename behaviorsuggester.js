// 行動改善提案ユーティリティ
const BehaviorSuggester = {
  generateSuggestions() {
    const tasks = TaskStorage.getTasks();
    const suggestions = [];
    
    if (tasks.length === 0) {
      return ["タスクデータがまだありません。タスクを追加して使い続けてください。"];
    }
    
    // 緊急タスクの比率分析
    const completedTasks = tasks.filter(task => task.status === 'completed');
    if (completedTasks.length === 0) {
      return ["まだ完了したタスクがありません。タスクを完了すると、より詳細な提案が表示されます。"];
    }
    
    const urgentCompletedTasks = completedTasks.filter(task => task.urgency >= 4);
    const urgentRatio = completedTasks.length > 0 ? 
      urgentCompletedTasks.length / completedTasks.length : 0;
    
    if (urgentRatio > 0.6) {
      suggestions.push(
        "緊急度が高いタスクを減らすために、毎朝10分間、重要なタスクを計画しましょう。"
      );
    }
    
    // 先延ばし傾向の分析
    const postponedTasks = tasks.filter(task => task.postponedCount > 0);
    const avgPostponedCount = postponedTasks.length > 0 ?
      postponedTasks.reduce((sum, task) => sum + task.postponedCount, 0) / postponedTasks.length : 0;
    
    if (avgPostponedCount > 1.5) {
      suggestions.push(
        "先延ばしが多いので、タスクをもっと小さく分割してみましょう。"
      );
    }
    
    // タスク所要時間の予測精度
    const tasksWithBothTimes = completedTasks.filter(
      task => task.estimatedTime && task.actualTime
    );
    
    if (tasksWithBothTimes.length > 0) {
      const avgTimeDiff = tasksWithBothTimes.reduce(
        (sum, task) => sum + Math.abs(task.actualTime - task.estimatedTime) / task.estimatedTime, 0
      ) / tasksWithBothTimes.length;
      
      if (avgTimeDiff > 0.3) {
        suggestions.push(
          "タスクの所要時間の見積もりが実際と大きく異なっています。タスクを細分化して、より正確な見積もりを立てましょう。"
        );
      }
    }
    
    if (suggestions.length === 0) {
      suggestions.push("現在のタスク管理は効率的です。このまま続けましょう！");
    }
    
    return suggestions;
  }
};
