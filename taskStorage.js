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
  }
};
