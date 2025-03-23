// Background script to handle any extension-wide functionality
chrome.runtime.onInstalled.addListener(function() {
  console.log('Resume Customizer extension installed');
  
  // Initialize storage with default values
  chrome.storage.local.get(['resumeContent'], function(result) {
    if (!result.resumeContent) {
      chrome.storage.local.set({ 'resumeContent': '' });
    }
  });
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "customizeResume") {
    // Could implement additional logic here if needed
    sendResponse({ success: true });
  }
});

// Optional: Add context menu
chrome.contextMenus?.create({
  id: "extractJobDescription",
  title: "Extract Job Description",
  contexts: ["page"],
  documentUrlPatterns: [
    "*://*.linkedin.com/jobs/*",
    "*://*.indeed.com/*",
    "*://*.glassdoor.com/*"
  ]
});

// Handle context menu clicks
chrome.contextMenus?.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === "extractJobDescription") {
    chrome.tabs.sendMessage(tab.id, { action: "extractJobDescription" }, function(response) {
      if (response && response.jobDescription) {
        // Store the extracted job description
        chrome.storage.local.set({ 'tempJobDescription': response.jobDescription });
        
        // Notify the user
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'Job Description Extracted',
          message: 'Open the extension to customize your resume'
        });
      }
    });
  }
});