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
  
  // カテゴリ選択UIの初期化
  initCategorySelectors();
  
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
    const mainCategory = document.getElementById('main-category').value;
    const subCategory = document.getElementById('sub-category').value;
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
      category: {
        main: mainCategory,
        sub: subCategory
      },
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
      taskId: task.id,
      category: {
        main: mainCategory,
        sub: subCategory
      }
    });
    
    // フォームをリセット
    taskForm.reset();
    document.getElementById('due-date').valueAsDate = new Date();
    document.getElementById('sub-category').innerHTML = '<option value="">メインカテゴリを先に選択</option>';
    
    // タスクリストを更新
    renderTaskList();
  });
  
  // カテゴリ選択UIの初期化関数
  function initCategorySelectors() {
    const mainCategorySelect = document.getElementById('main-category');
    const subCategorySelect = document.getElementById('sub-category');
    
    // 全カテゴリを取得
    const allCategories = TaskStorage.getAllCategories();
    
    // メインカテゴリのオプションを生成
    Object.keys(allCategories).forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      mainCategorySelect.appendChild(option);
    });
    
    // メインカテゴリ変更時のイベントリスナー
    mainCategorySelect.addEventListener('change', () => {
      const selectedMainCategory = mainCategorySelect.value;
      
      // サブカテゴリの選択肢をリセット
      subCategorySelect.innerHTML = '<option value="">選択してください</option>';
      
      if (selectedMainCategory && allCategories[selectedMainCategory]) {
        // 選択されたメインカテゴリに対応するサブカテゴリを表示
        allCategories[selectedMainCategory].subcategories.forEach(subCategory => {
          const option = document.createElement('option');
          option.value = subCategory;
          option.textContent = subCategory;
          subCategorySelect.appendChild(option);
        });
      }
    });
  }
  
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
      
      // カテゴリに基づくクラス追加
      if (task.category && task.category.main) {
        if (task.category.main === '対顧客対応') {
          taskElement.classList.add('category-customer');
        } else if (task.category.main === '事業開発') {
          taskElement.classList.add('category-business');
        } else if (task.category.main === '社内業務') {
          taskElement.classList.add('category-internal');
        }
      }
      
      // 期限が近いかチェック
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      const isNearDue = dueDate < new Date(today.setDate(today.getDate() + 2));
      
      // カテゴリ情報を表示に追加
      const categoryInfo = task.category && task.category.main ? 
        `<div class="task-category">${task.category.main} > ${task.category.sub || '未分類'}</div>` : '';
      
      taskElement.innerHTML = `
        <div class="task-header">
          <h3 class="task-title">${task.title}</h3>
          <div>
            <span class="badge ${task.urgency >= 4 ? 'badge-urgent' : ''}">${'緊急度: ' + task.urgency}</span>
            <span class="badge ${task.importance >= 4 ? 'badge-important' : ''}">${'重要度: ' + task.importance}</span>
          </div>
        </div>
        ${categoryInfo}
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
    const categoryAnalysis = TaskAnalyzer.generateCategoryAnalysis();
    
    analyticsContent.innerHTML = '<h3>全体傾向</h3>';
    
    // 全体傾向の表示
    reviewMessages.forEach(message => {
      const alertElement = document.createElement('div');
      alertElement.className = 'alert alert-warning';
      alertElement.textContent = message;
      analyticsContent.appendChild(alertElement);
    });
    
    // カテゴリ別分析の表示
    const categorySection = document.createElement('div');
    categorySection.innerHTML = '<h3 class="mt-4">カテゴリ別分析</h3>';
    
    categoryAnalysis.message.forEach(message => {
      const alertElement = document.createElement('div');
      alertElement.className = 'alert alert-info';
      alertElement.textContent = message;
      categorySection.appendChild(alertElement);
    });
    
    // カテゴリデータがあれば表形式で表示
    if (Object.keys(categoryAnalysis.data).length > 0) {
      const tableElement = document.createElement('table');
      tableElement.className = 'category-table';
      
      tableElement.innerHTML = `
        <thead>
          <tr>
            <th>カテゴリ</th>
            <th>タスク数</th>
            <th>時間差(分)</th>
            <th>先延ばし率</th>
          </tr>
        </thead>
        <tbody>
          ${Object.keys(categoryAnalysis.data).map(category => {
            const data = categoryAnalysis.data[category];
            return `
              <tr>
                <td>${category}</td>
                <td>${data.count}</td>
                <td>${data.avgTimeDiff > 0 ? '+' : ''}${data.avgTimeDiff}</td>
                <td>${data.postponedRate}%</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      `;
      
      categorySection.appendChild(tableElement);
    }
    
    analyticsContent.appendChild(categorySection);
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
