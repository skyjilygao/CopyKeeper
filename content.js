// 监听用户复制文本的事件
document.addEventListener('copy', function(e) {
  // 获取用户选中的文本（即将被复制的文本）
  const copiedText = window.getSelection().toString().trim();
  
  // 如果有复制的文本，则处理
  if (copiedText) {
    console.log('复制的文本:', copiedText);
    
    // 添加错误处理，防止扩展上下文失效时的错误
    try {
      // 获取选项设置
      chrome.storage.local.get(['options'], function(result) {
      const options = result.options || {
        autoCopy: false,
        showTime: true,
        showUrl: true,
        autoSave: true
      };
      
      // 如果启用了自动保存选项，则保存文本
      if (options.autoSave) {
        // 将复制的文本发送给后台脚本
        chrome.runtime.sendMessage({
          action: 'saveCopiedText',
          text: copiedText,
          url: window.location.href,
          timestamp: new Date().toISOString()
        });
      }
      
      // 注意：在copy事件中，浏览器已经处理了复制操作
      // 如果需要修改剪贴板内容，可以使用e.clipboardData.setData
      // 但这需要调用e.preventDefault()，会覆盖默认的复制行为
      // 这里我们不需要额外处理，因为我们只是想记录复制的文本
    });
    } catch (error) {
      // 捕获可能的错误，例如扩展上下文失效
      console.error('扩展操作错误:', error.message);
    }
  }
});