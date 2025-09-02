// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  // 如果是保存文本的消息（支持旧的saveSelectedText和新的saveCopiedText）
  if (message.action === 'saveSelectedText' || message.action === 'saveCopiedText') {
    try {
      // 从存储中获取设置和已保存的文本
      chrome.storage.local.get(['selectedTexts', 'maxRecords', 'options'], function(result) {
      // 获取选项设置
      const options = result.options || {
        autoSave: true, // 默认启用自动保存
        showTime: true,
        showUrl: true,
        autoCopy: false
      };
      
      // 如果未启用自动保存，则直接返回
      if (!options.autoSave) {
        console.log('自动保存已禁用，文本未保存');
        return;
      }
      
      // 如果没有保存的文本，则创建一个空数组
      const selectedTexts = result.selectedTexts || [];
      // 获取最大记录数设置，默认为50
      const maxRecords = result.maxRecords || 50;
      
      // 检查是否与最近一条记录重复（内容和URL都相同）
      // 先按时间戳降序排序，确保最新的记录在前面
      const sortedTexts = [...selectedTexts].sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
      
      // 检查是否与最新的记录重复（内容和URL都相同）
      const isDuplicate = sortedTexts.length > 0 && 
                          sortedTexts[0].text === message.text && 
                          sortedTexts[0].url === message.url;
      
      // 如果不是重复记录，则添加新的文本
      if (!isDuplicate) {
        // 添加新的文本，包括文本内容、来源URL和时间戳
        selectedTexts.push({
          text: message.text,
          url: message.url,
          timestamp: message.timestamp
        });
      }
      
      // 如果记录数超过最大值，则移除最早的记录
      if (selectedTexts.length > maxRecords) {
        // 按时间排序（从旧到新）
        const sortedTexts = selectedTexts.sort((a, b) => {
          return new Date(a.timestamp) - new Date(b.timestamp);
        });
        
        // 移除最早的记录（保留最新的maxRecords条记录）
        const trimmedTexts = sortedTexts.slice(selectedTexts.length - maxRecords);
        
        // 将更新后的文本保存回存储
        chrome.storage.local.set({ selectedTexts: trimmedTexts }, function() {
          console.log('复制的文本已保存，超出限制的最早记录已移除');
        });
      } else {
        // 将更新后的文本保存回存储
        chrome.storage.local.set({ selectedTexts: selectedTexts }, function() {
          console.log('复制的文本已保存');
        });
      }
    });
    } catch (error) {
      // 捕获可能的错误，例如扩展上下文失效
      console.error('扩展操作错误:', error.message);
    }
  }
  
  return true; // 表示异步响应
});