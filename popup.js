// 当弹出窗口加载时，显示已保存的复制文本
function initializeOptions() {
  // 初始化默认选项
  chrome.storage.local.get(['options'], function(result) {
    const options = result.options || {
      autoSave: true,
      showTime: true,
      showUrl: true,
      autoCopy: false
    };
    
    // 保存默认选项
    chrome.storage.local.set({ options: options });
  });
}

// 初始化选项设置
initializeOptions();

document.addEventListener('DOMContentLoaded', function() {
  // 获取DOM元素
  const selectedTextsContainer = document.getElementById('selected-texts-container');
  const clearBtn = document.getElementById('clear-btn');
  const maxRecordsInput = document.getElementById('max-records');
  
  // 从存储中获取设置和已保存的文本
  try {
    chrome.storage.local.get(['selectedTexts', 'maxRecords'], function(result) {
      const selectedTexts = result.selectedTexts || [];
      const maxRecords = result.maxRecords || 50;
      
      // 设置保存条数输入框的值
      maxRecordsInput.value = maxRecords;
      
      // 显示文本记录
      displayTexts(selectedTexts);
    });
  } catch (error) {
    console.error('获取存储数据错误:', error.message);
    selectedTextsContainer.innerHTML = '<p class="no-items">加载数据时出错</p>';
  }
  
  // 保存条数设置变更事件
  maxRecordsInput.addEventListener('change', function() {
    let value = parseInt(maxRecordsInput.value);
    
    // 确保值在有效范围内
    if (isNaN(value) || value < 1) value = 1;
    if (value > 500) value = 500;
    
    maxRecordsInput.value = value;
    
    // 保存设置
    try {
      chrome.storage.local.set({ maxRecords: value }, function() {
        console.log('保存条数设置已更新:', value);
        
        // 获取当前文本记录并应用新的限制
        try {
          chrome.storage.local.get(['selectedTexts'], function(result) {
            const selectedTexts = result.selectedTexts || [];
            
            // 如果当前记录数超过设置的最大值，则移除最早的记录
            if (selectedTexts.length > value) {
              // 按时间排序（从旧到新）
              const sortedTexts = selectedTexts.sort((a, b) => {
                return new Date(a.timestamp) - new Date(b.timestamp);
              });
              
              // 移除最早的记录（保留最新的value条记录）
              const trimmedTexts = sortedTexts.slice(selectedTexts.length - value);
              
              // 保存更新后的记录
              try {
                chrome.storage.local.set({ selectedTexts: trimmedTexts }, function() {
                  // 更新显示
                  displayTexts(trimmedTexts);
                });
              } catch (error) {
                console.error('保存更新后的记录错误:', error.message);
              }
            }
          });
        } catch (error) {
          console.error('获取文本记录错误:', error.message);
        }
      });
    } catch (error) {
      console.error('保存设置错误:', error.message);
    }
  });
  
  // 清除按钮点击事件
  clearBtn.addEventListener('click', function() {
    try {
      chrome.storage.local.set({ selectedTexts: [] }, function() {
        selectedTextsContainer.innerHTML = '<p class="no-items">暂无复制的文本记录</p>';
      });
    } catch (error) {
      console.error('清除记录错误:', error.message);
      selectedTextsContainer.innerHTML = '<p class="no-items">清除记录时出错</p>';
    }
  });
  
  // 显示文本记录的函数
  function displayTexts(texts) {
    // 如果没有保存的文本，显示提示信息
    if (texts.length === 0) {
      selectedTextsContainer.innerHTML = '<p class="no-items">暂无复制的文本记录</p>';
      return;
    }
    
    // 清空容器
    selectedTextsContainer.innerHTML = '';
    
    // 按时间倒序排列文本记录
    const sortedTexts = texts.sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    // 显示每条文本记录
      sortedTexts.forEach(function(item) {
        const textItem = document.createElement('div');
        textItem.className = 'text-item';
        
        const textContent = document.createElement('div');
        textContent.className = 'text-content';
        textContent.textContent = item.text;
        
        // 添加点击展开/折叠功能
        textContent.addEventListener('click', function() {
          textContent.classList.toggle('expanded');
          if (expandHint) {
            expandHint.style.display = textContent.classList.contains('expanded') ? 'none' : 'block';
          }
        });
        
        // 创建展开提示（仅对长文本显示）
        let expandHint = null;
        if (item.text.length > 50) {
          expandHint = document.createElement('div');
          expandHint.className = 'expand-hint';
          expandHint.textContent = '点击展开全文';
          expandHint.addEventListener('click', function() {
            textContent.classList.toggle('expanded');
            expandHint.style.display = textContent.classList.contains('expanded') ? 'none' : 'block';
          });
        }
        
        const textMeta = document.createElement('div');
        textMeta.className = 'text-meta';
        
        // 格式化时间
        const date = new Date(item.timestamp);
        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        
        // 创建元信息容器
        const metaInfo = document.createElement('div');
        metaInfo.className = 'meta-info';
        metaInfo.innerHTML = `来源: <a href="${item.url}" target="_blank">${item.url}</a><br>时间: ${formattedDate}`;
        
        // 创建复制按钮
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = '复制';
        copyBtn.addEventListener('click', function() {
          // 复制文本到剪贴板
          navigator.clipboard.writeText(item.text).then(function() {
            // 临时改变按钮文字表示成功
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '已复制';
            setTimeout(function() {
              copyBtn.textContent = originalText;
            }, 1000);
          }).catch(function(err) {
            console.error('复制失败:', err);
            // 备用复制方法
            const textArea = document.createElement('textarea');
            textArea.value = item.text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
              document.execCommand('copy');
              const originalText = copyBtn.textContent;
              copyBtn.textContent = '已复制';
              setTimeout(function() {
                copyBtn.textContent = originalText;
              }, 1000);
            } catch (fallbackErr) {
              console.error('备用复制方法也失败:', fallbackErr);
            }
            document.body.removeChild(textArea);
          });
        });
        
        // 添加到容器中
        textItem.appendChild(textContent);
        if (expandHint) {
          textItem.appendChild(expandHint);
        }
        textMeta.appendChild(metaInfo);
        textMeta.appendChild(copyBtn);
        textItem.appendChild(textMeta);
        selectedTextsContainer.appendChild(textItem);
      });
  }
});