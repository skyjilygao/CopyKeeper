// 监听用户复制文本的事件
document.addEventListener('copy', function(e) {
  // 获取用户选中的文本（即将被复制的文本）
  const copiedText = window.getSelection().toString().trim();
  
  // 如果有复制的文本，则处理
  if (copiedText) {
    console.log('复制的文本:', copiedText);
    
    // 添加错误处理，防止扩展上下文失效时的错误
    try {
      // 直接发送消息给后台脚本，由后台脚本处理存储逻辑
      chrome.runtime.sendMessage({
        action: 'saveCopiedText',
        text: copiedText,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // 捕获可能的错误，例如扩展上下文失效
      console.error('扩展操作错误:', error.message);
    }
  }
});