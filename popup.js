document.addEventListener('DOMContentLoaded', function() {
  // Tab navigation
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');
      
      // Update active tab
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show corresponding content
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // Setup tab functionality
  const saveResumeButton = document.getElementById('saveResume');
  saveResumeButton.addEventListener('click', function() {
    const resumeContent = document.getElementById('resumeContent').value;
    if (resumeContent.trim() === '') {
      document.getElementById('setupStatus').textContent = 'Please enter your resume content';
      return;
    }
    
    chrome.storage.local.set({ 'resumeContent': resumeContent }, function() {
      document.getElementById('setupStatus').textContent = 'Resume saved successfully!';
      
      // Auto-switch to the next tab
      setTimeout(() => {
        document.querySelector('[data-tab="customize"]').click();
      }, 1000);
    });
  });
  
  // Customize tab functionality
  const extractButton = document.getElementById('extractJobDescription');
  extractButton.addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "extractJobDescription" }, function(response) {
        if (response && response.jobDescription) {
          document.getElementById('jobDescription').value = response.jobDescription;
          document.getElementById('customizeStatus').textContent = 'Job description extracted!';
        } else {
          document.getElementById('customizeStatus').textContent = 'Could not extract job description. Try another page or paste it manually.';
        }
      });
    });
  });
  
  const customizeButton = document.getElementById('customizeResume');
  customizeButton.addEventListener('click', function() {
    const jobDescription = document.getElementById('jobDescription').value;
    if (jobDescription.trim() === '') {
      document.getElementById('customizeStatus').textContent = 'Please enter a job description';
      return;
    }
    
    // Get saved resume
    chrome.storage.local.get(['resumeContent'], function(result) {
      if (!result.resumeContent) {
        document.getElementById('customizeStatus').textContent = 'No resume found. Please go to Setup tab first';
        return;
      }
      
      document.getElementById('customizeStatus').textContent = 'Customizing resume... This may take a minute.';
      
      // Call your n8n endpoint
      fetch('https://n8n.cognitoapps.in/webhook/customize-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          //,
          //'X-API-Key': 'resume-customizer-key' // You can change this to match your n8n configuration
        },
        body: JSON.stringify({
          jobDescription: jobDescription,
          resumeContent: result.resumeContent
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          document.getElementById('customizedResume').value = data.data.customizedResume;
          document.getElementById('customizeStatus').textContent = 'Resume customized successfully!';
          
          // Auto-switch to the result tab
          setTimeout(() => {
            document.querySelector('[data-tab="result"]').click();
          }, 1000);
        } else {
          document.getElementById('customizeStatus').textContent = 'Error: ' + (data.message || 'Unknown error');
        }
      })
      .catch(error => {
        document.getElementById('customizeStatus').textContent = 'Error: ' + error.message;
      });
    });
  });
  
  // Result tab functionality
  const copyButton = document.getElementById('copyResume');
  copyButton.addEventListener('click', function() {
    const customizedResume = document.getElementById('customizedResume');
    customizedResume.select();
    document.execCommand('copy');
    document.getElementById('resultStatus').textContent = 'Copied to clipboard!';
    setTimeout(() => {
      document.getElementById('resultStatus').textContent = '';
    }, 2000);
  });
  
  const downloadButton = document.getElementById('downloadResume');
  downloadButton.addEventListener('click', function() {
    const customizedResume = document.getElementById('customizedResume').value;
    const blob = new Blob([customizedResume], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customized_resume.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    document.getElementById('resultStatus').textContent = 'Downloaded!';
    setTimeout(() => {
      document.getElementById('resultStatus').textContent = '';
    }, 2000);
  });
  
  // Load any saved data when popup opens
  chrome.storage.local.get(['resumeContent'], function(result) {
    if (result.resumeContent) {
      document.getElementById('resumeContent').value = result.resumeContent;
    }
  });
});