// Background service worker for RoadPulse Companion Extension (Manifest V3)
chrome.runtime.onInstalled.addListener(() => {
  console.log('[RoadPulse] Chrome Companion Extension installed successfully.');
});

// Listener for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHECK_SERVICE_HEALTH') {
    fetch('http://localhost:5001/api/health')
      .then(res => res.json())
      .then(data => sendResponse({ online: true, data }))
      .catch(err => sendResponse({ online: false, error: err.message }));
    return true; // asynchronous response
  }
});
