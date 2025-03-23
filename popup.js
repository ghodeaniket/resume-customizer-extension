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
      
      // Store request start time for estimation
      const startTime = new Date().getTime();
      chrome.storage.local.set({ 
        'processingJob': {
          startTime: startTime,
          jobDescription: jobDescription,
          status: 'processing'
        }
      });
      
      // We'll use more realistic progress estimation
      // Typically this process takes about 30-60 seconds
      let progress = 0;
      let phase = 1; // 1=start, 2=processing, 3=finishing
      
      const progressInterval = setInterval(() => {
        // Calculate elapsed time in seconds
        const elapsed = (new Date().getTime() - startTime) / 1000;
        
        if (elapsed < 5) {
          // Phase 1: Initial API call and setup (0-10%)
          progress = Math.min(10, elapsed * 2);
        } else if (elapsed < 30) {
          // Phase 2: Main AI processing (10-70%)
          // Slower progress in the middle phase
          progress = 10 + Math.min(60, (elapsed - 5) * (60/25));
          phase = 2;
        } else {
          // Phase 3: Final processing and response (70-90%)
          progress = 70 + Math.min(20, (elapsed - 30) * (20/20));
          phase = 3;
        }
        
        // Update progress bar
        progressBar.style.width = progress + '%';
        
        // Update status text based on phase
        if (phase === 1) {
          customizeStatus.textContent = 'Starting the customization process...';
        } else if (phase === 2) {
          customizeStatus.textContent = 'AI is analyzing and customizing your resume...';
        } else {
          customizeStatus.textContent = 'Almost done! Finalizing your resume...';
        }
        
        // Prevent going past 90% until we get actual completion
        if (progress >= 90) {
          progress = 90;
          clearInterval(progressInterval);
          
          // Set a maximum timeout in case the request never completes
          setTimeout(() => {
            clearInterval(progressInterval);
            progressIndicator.style.display = 'none';
            customizeStatus.textContent = 'Request timed out. Please try again.';
            customizeStatus.className = 'status error';
            
            // Clear the processing job
            chrome.storage.local.remove('processingJob');
          }, 120000); // 2 minute maximum timeout
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
        
        // Clear the processing job status
        chrome.storage.local.remove('processingJob');
        
        setTimeout(() => {
          progressIndicator.style.display = 'none';
          
          // Handle different response formats from n8n
          let customizedContent = '';
          let success = false;
          
          if (data.status === 'success' && data.data && data.data.customizedResume) {
            // Standard format we expect
            customizedContent = data.data.customizedResume;
            success = true;
          } else if (typeof data === 'string') {
            // Plain text response
            customizedContent = data;
            success = true;
          } else if (data.text) {
            // Alternate format with direct text property
            customizedContent = data.text;
            success = true;
          } else if (data.customizedResume) {
            // Direct customizedResume property
            customizedContent = data.customizedResume;
            success = true;
          } else {
            // Try to find any text-like property in the response
            for (const key in data) {
              if (typeof data[key] === 'string' && data[key].length > 100) {
                customizedContent = data[key];
                success = true;
                break;
              }
            }
          }
          
          if (success) {
            document.getElementById('customizedResume').value = customizedContent;
            customizeStatus.textContent = 'Resume customized successfully!';
            customizeStatus.className = 'status success';
            resultContainer.classList.remove('hidden');
            
            // Save the customized resume
            chrome.storage.local.set({ 'customizedResume': customizedContent });
          } else {
            customizeStatus.textContent = 'Error: Invalid response format. Check n8n workflow output format.';
            customizeStatus.className = 'status error';
            console.error('Invalid response format:', data);
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
  chrome.storage.local.get(['resumeContent', 'customizedResume', 'jobDescription', 'processingJob'], function(result) {
    // Restore resume content
    if (result.resumeContent) {
      resumeContent.value = result.resumeContent;
    }
    
    // Restore job description
    if (result.jobDescription) {
      document.getElementById('jobDescription').value = result.jobDescription;
    }
    
    // Restore customized resume if available
    if (result.customizedResume) {
      document.getElementById('customizedResume').value = result.customizedResume;
      resultContainer.classList.remove('hidden');
    }
    
    // Check if we have an in-progress job
    if (result.processingJob && result.processingJob.status === 'processing') {
      // We have a job in progress, show its status
      const elapsed = (new Date().getTime() - result.processingJob.startTime) / 1000;
      
      // If it's been less than 3 minutes, consider it still active
      if (elapsed < 180) {
        customizeStatus.textContent = 'Resume customization in progress. Reopen extension after a minute to check status.';
        customizeStatus.className = 'status';
        
        // Restore job description
        if (result.processingJob.jobDescription) {
          document.getElementById('jobDescription').value = result.processingJob.jobDescription;
        }
      } else {
        // It's been too long, probably failed
        chrome.storage.local.remove('processingJob');
      }
    }
  });
  
  // Save job description when it changes
  document.getElementById('jobDescription').addEventListener('input', function() {
    chrome.storage.local.set({ 'jobDescription': this.value });
  });
});