chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'setUserId') {
    chrome.storage.local.set({ userId: message.userId });
  } else if (message.action === 'getUserId') {
    chrome.storage.local.get('userId', result => {
      sendResponse({ userId: result.userId });
    });
    return true;
  }
});
