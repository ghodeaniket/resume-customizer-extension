document.addEventListener('DOMContentLoaded', function() {
  // File upload handling
  const resumeFileInput = document.getElementById('resumeFile');
  const resumeContent = document.getElementById('resumeContent');
  const fileStatus = document.getElementById('fileStatus');
  
  resumeFileInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    fileStatus.textContent = `Reading file: ${file.name}`;
    
    if (file.type === 'text/plain') {
      // Handle TXT files
      const reader = new FileReader();
      reader.onload = function(e) {
        resumeContent.value = e.target.result;
        fileStatus.textContent = `Successfully loaded: ${file.name}`;
        fileStatus.className = 'status success';
      };
      reader.onerror = function() {
        fileStatus.textContent = 'Error reading file';
        fileStatus.className = 'status error';
      };
      reader.readAsText(file);
    } 
    else if (file.type === 'application/pdf' || 
             file.name.endsWith('.pdf')) {
      // For PDFs - we can only extract text in simple cases
      // More complex PDFs might require server-side processing
      fileStatus.textContent = 'Processing PDF file...';
      
      const reader = new FileReader();
      reader.onload = function(e) {
        // For simplicity, we'll just indicate that we'd need more sophisticated handling
        resumeContent.value = "PDF content would be extracted here. For now, please copy and paste the content manually.";
        fileStatus.textContent = 'PDF detected. Please paste resume content manually for best results.';
        fileStatus.className = 'status';
      };
      reader.readAsArrayBuffer(file);
    }
    else if (file.type.includes('word') || 
             file.name.endsWith('.docx') || 
             file.name.endsWith('.doc')) {
      // For Word docs - similar limitation
      fileStatus.textContent = 'Processing Word document...';
      resumeContent.value = "Word document content would be extracted here. For now, please copy and paste the content manually.";
      fileStatus.textContent = 'Word document detected. Please paste resume content manually for best results.';
      fileStatus.className = 'status';
    }
    else {
      fileStatus.textContent = 'Unsupported file type. Please use TXT, PDF, or Word documents.';
      fileStatus.className = 'status error';
    }
  });
  
  // Save resume functionality
  const saveResumeButton = document.getElementById('saveResume');
  saveResumeButton.addEventListener('click', function() {
    const content = resumeContent.value;
    if (content.trim() === '') {
      document.getElementById('setupStatus').textContent = 'Please enter your resume content';
      document.getElementById('setupStatus').className = 'status error';
      return;
    }
    
    chrome.storage.local.set({ 'resumeContent': content }, function() {
      document.getElementById('setupStatus').textContent = 'Resume saved successfully!';
      document.getElementById('setupStatus').className = 'status success';
    });
  });
  
  // Job description extraction
  const extractButton = document.getElementById('extractJobDescription');
  extractButton.addEventListener('click', function() {
    const extractStatus = document.getElementById('extractStatus');
    extractStatus.textContent = 'Extracting job description...';
    extractStatus.className = 'status';
    
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "extractJobDescription" }, function(response) {
        if (response && response.jobDescription) {
          document.getElementById('jobDescription').value = response.jobDescription;
          extractStatus.textContent = 'Job description extracted successfully!';
          extractStatus.className = 'status success';
        } else {
          extractStatus.textContent = 'Could not extract job description. Try another page or paste it manually.';
          extractStatus.className = 'status error';
        }
      });
    });
  });
  
  // Customize resume functionality
  const customizeButton = document.getElementById('customizeResume');
  const customizeStatus = document.getElementById('customizeStatus');
  const progressIndicator = document.getElementById('progressIndicator');
  const progressBar = document.getElementById('progressBar');
  const resultContainer = document.getElementById('resultContainer');
  
  customizeButton.addEventListener('click', function() {
    const jobDescription = document.getElementById('jobDescription').value;
    if (jobDescription.trim() === '') {
      customizeStatus.textContent = 'Please enter or extract a job description';
      customizeStatus.className = 'status error';
      return;
    }
    
    // Get saved resume
    chrome.storage.local.get(['resumeContent'], function(result) {
      if (!result.resumeContent || result.resumeContent.trim() === '') {
        customizeStatus.textContent = 'No resume found. Please save your resume first';
        customizeStatus.className = 'status error';
        return;
      }
      
      // Show progress indicator
      customizeStatus.textContent = 'Customizing resume... This may take up to a minute.';
      customizeStatus.className = 'status';
      progressIndicator.style.display = 'block';
      
      // Simulate progress (since we don't have real-time updates from the server)
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 5;
        if (progress <= 90) {
          progressBar.style.width = progress + '%';
        }
      }, 1000);
      
      // Call n8n endpoint - using the URL from your current configuration
      fetch('https://n8n.cognitoapps.in/webhook/customize-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // 'X-API-Key': 'resume-customizer-key' // Uncomment if you need API key auth
        },
        body: JSON.stringify({
          jobDescription: jobDescription,
          resumeContent: result.resumeContent
        })
      })
      .then(response => response.json())
      .then(data => {
        clearInterval(progressInterval);
        progressBar.style.width = '100%';
        
        setTimeout(() => {
          progressIndicator.style.display = 'none';
          
          if (data.status === 'success') {
            document.getElementById('customizedResume').value = data.data.customizedResume;
            customizeStatus.textContent = 'Resume customized successfully!';
            customizeStatus.className = 'status success';
            resultContainer.classList.remove('hidden');
          } else {
            customizeStatus.textContent = 'Error: ' + (data.message || 'Unknown error');
            customizeStatus.className = 'status error';
          }
        }, 500);
      })
      .catch(error => {
        clearInterval(progressInterval);
        progressIndicator.style.display = 'none';
        customizeStatus.textContent = 'Error: ' + error.message;
        customizeStatus.className = 'status error';
      });
    });
  });
  
  // Copy to clipboard functionality
  const copyButton = document.getElementById('copyResume');
  copyButton.addEventListener('click', function() {
    const customizedResume = document.getElementById('customizedResume');
    customizedResume.select();
    document.execCommand('copy');
    
    const resultStatus = document.getElementById('resultStatus');
    resultStatus.textContent = 'Copied to clipboard!';
    resultStatus.className = 'status success';
    
    setTimeout(() => {
      resultStatus.textContent = '';
    }, 2000);
  });
  
  // Download functionality
  const downloadButton = document.getElementById('downloadResume');
  downloadButton.addEventListener('click', function() {
    const customizedResume = document.getElementById('customizedResume').value;
    if (!customizedResume.trim()) {
      const resultStatus = document.getElementById('resultStatus');
      resultStatus.textContent = 'No content to download';
      resultStatus.className = 'status error';
      return;
    }
    
    const blob = new Blob([customizedResume], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customized_resume.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    const resultStatus = document.getElementById('resultStatus');
    resultStatus.textContent = 'Downloaded!';
    resultStatus.className = 'status success';
    
    setTimeout(() => {
      resultStatus.textContent = '';
    }, 2000);
  });
  
  // Load any saved data when popup opens
  chrome.storage.local.get(['resumeContent'], function(result) {
    if (result.resumeContent) {
      resumeContent.value = result.resumeContent;
    }
  });
});