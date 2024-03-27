chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getUserId') {
    const userId = localStorage.getItem('userId');
    sendResponse(userId);
  }
});
