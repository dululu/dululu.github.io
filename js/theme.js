(function() {
  // 获取保存的主题或默认使用亮色
  const savedTheme = localStorage.getItem('theme') || 'light';
  
  // 应用主题
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // 更新 utterances 主题
    const utterancesFrame = document.querySelector('iframe[src*="utteranc.es"]');
    if (utterancesFrame) {
      const newTheme = theme === 'dark' ? 'github-dark' : 'github-light';
      utterancesFrame.contentWindow.postMessage({
        type: 'set-theme',
        theme: newTheme
      }, 'https://utteranc.es');
    }
  }
  
  // 初始化主题
  applyTheme(savedTheme);
  
  // 切换主题函数
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  }
  
  // 暴露到全局
  window.toggleTheme = toggleTheme;
  
  // 监听系统主题变化
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', function(e) {
      // 如果用户没有手动设置过主题，跟随系统
      if (!localStorage.getItem('theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
})();
