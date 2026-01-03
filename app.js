document.addEventListener('DOMContentLoaded', () => {
  // DOM要素の取得
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const taskForm = document.getElementById('task-form');
  const taskList = document.getElementById('task-list');
  const analyticsContent = document.getElementById('analytics-content');
  const suggestionsContent = document.getElementById('suggestions-content');
  
  // 日付入力フィールドの初期値を今日に設定
  document.getElementById('due-date').valueAsDate = new Date();
  
  // タブ切り替え機能
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // アクティブなタブをリセット
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // クリックされたタブをアクティブに
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      document.getElementById(`${tabId}-tab`).classList.add('active');
      
      // タブに応じたコンテンツ更新
      if (tabId === 'analytics') {
        updateAnalytics();
      } else if (tabId === 'suggestions') {
        updateSuggestions();
      }
    });
  });
  
  // タスク追加フォームの送信処理
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const urgency = parseInt(document.getElementById('urgency').value);
    const importance = parseInt(document.getElementById('importance').value);
    const estimatedTime = parseInt(document.getElementById('estimated-time').value);
    const dueDate = document.getElementById('due-date').value;
    
    if (!title) return;
    
    // 新しいタスクオブジェクトの作成
    const task = {
      id: Date.now().toString(),
      title,
      description,
      urgency,
      importance,
      estimatedTime,
      dueDate,
      createdAt: new Date().toISOString(),
      status: 'pending',
      postponedCount: 0
    };
    
    // タスクを保存
    const tasks = TaskStorage.getTasks();
    tasks.push(task);
    TaskStorage.saveTasks(tasks);
    
    // 行動ログを記録
    TaskStorage.saveActionLog({
      type: 'task_created',
      taskId: task.id
    });
    
    // フォームをリセット
    taskForm.reset();
    document.getElementById('due-date').valueAsDate = new Date();
    
    // タスクリストを更新
    renderTaskList();
  });
  
  // タスクリストの表示
  function renderTaskList() {
    const tasks = TaskStorage.getTasks();
    const pendingTasks = tasks.filter(task => 
      task.status === 'pending' || task.status === 'in-progress'
    );
    
    if (pendingTasks.length === 0) {
      taskList.innerHTML = `
        <div class="empty-state">
          <p>タスクがありません。新しいタスクを追加してください。</p>
        </div>
      `;
      return;
    }
    
    taskList.innerHTML = '';
    pendingTasks.forEach(task => {
      const taskElement = document.createElement('div');
      taskElement.className = 'task-card';
      
      // 期限が近いかチェック
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      const isNearDue = dueDate < new Date(today.setDate(today.getDate() + 2));
      
      taskElement.innerHTML = `
        <div class="task-header">
          <h3 class="task-title">${task.title}</h3>
          <div>
            <span class="badge ${task.urgency >= 4 ? 'badge-urgent' : ''}">${'緊急度: ' + task.urgency}</span>
            <span class="badge ${task.importance >= 4 ? 'badge-important' : ''}">${'重要度: ' + task.importance}</span>
          </div>
        </div>
        <p>${task.description}</p>
        <div class="task-meta">
          <div>予想時間: ${task.estimatedTime}分</div>
          <div>期限: ${new Date(task.dueDate).toLocaleDateString()} ${isNearDue ? '(期限間近!)' : ''}</div>
        </div>
        <div class="task-actions">
          <button class="btn btn-outline" onclick="postponeTask('${task.id}')">先延ばし</button>
          <button class="btn btn-outline" onclick="startTask('${task.id}')">着手</button>
          <button class="btn btn-primary" onclick="completeTask('${task.id}')">完了</button>
        </div>
      `;
      
      taskList.appendChild(taskElement);
    });
  }
  
  // 分析内容の更新
  function updateAnalytics() {
    const reviewMessages = TaskAnalyzer.generateWeeklyReview();
    
    analyticsContent.innerHTML = '';
    reviewMessages.forEach(message => {
      const alertElement = document.createElement('div');
      alertElement.className = 'alert alert-warning';
      alertElement.textContent = message;
      analyticsContent.appendChild(alertElement);
    });
  }
  
  // 提案内容の更新
  function updateSuggestions() {
    const suggestions = BehaviorSuggester.generateSuggestions();
    
    suggestionsContent.innerHTML = '';
    suggestions.forEach(suggestion => {
      const suggestionElement = document.createElement('div');
      suggestionElement.className = 'suggestion-card';
      suggestionElement.textContent = suggestion;
      suggestionsContent.appendChild(suggestionElement);
    });
  }
  
  // グローバルスコープに関数を公開
  window.postponeTask = function(taskId) {
    const tasks = TaskStorage.getTasks();
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          status: 'postponed',
          postponedCount: (task.postponedCount || 0) + 1
        };
      }
      return task;
    });
    
    TaskStorage.saveTasks(updatedTasks);
    TaskStorage.saveActionLog({
      type: 'task_postponed',
      taskId
    });
    
    renderTaskList();
  };
  
  window.startTask = function(taskId) {
    const tasks = TaskStorage.getTasks();
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          status: 'in-progress'
        };
      }
      return task;
    });
    
    TaskStorage.saveTasks(updatedTasks);
    TaskStorage.saveActionLog({
      type: 'task_started',
      taskId
    });
    
    renderTaskList();
  };
  
  window.completeTask = function(taskId) {
    // 実際の所要時間を入力するプロンプト
    const actualTime = prompt('実際にかかった時間（分）を入力してください:', '30');
    
    if (actualTime === null) return; // キャンセル時
    
    const tasks = TaskStorage.getTasks();
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          status: 'completed',
          completedAt: new Date().toISOString(),
          actualTime: parseInt(actualTime) || task.estimatedTime
        };
      }
      return task;
    });
    
    TaskStorage.saveTasks(updatedTasks);
    TaskStorage.saveActionLog({
      type: 'task_completed',
      taskId
    });
    
    renderTaskList();
  };
  
  // 初期表示
  renderTaskList();
});
