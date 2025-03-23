// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "extractJobDescription") {
    let jobDescription = '';
    
    // Different extraction logic based on the website
    if (window.location.hostname.includes('linkedin.com')) {
      // LinkedIn job extraction
      const descriptionElement = document.querySelector('.description__text');
      if (descriptionElement) {
        jobDescription = descriptionElement.innerText;
      }
    } 
    else if (window.location.hostname.includes('indeed.com')) {
      // Indeed job extraction
      const descriptionElement = document.querySelector('#jobDescriptionText');
      if (descriptionElement) {
        jobDescription = descriptionElement.innerText;
      }
    }
    else {
      // Generic extraction for other sites - try to find job description in common containers
      const possibleSelectors = [
        '.job-description',
        '#job-description',
        '[data-testid="jobDescriptionText"]',
        '.description',
        '.job-details'
      ];
      
      for (const selector of possibleSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          jobDescription = element.innerText;
          break;
        }
      }
      
      // If still not found, try a more aggressive approach
      if (!jobDescription) {
        // Look for sections with keywords related to job descriptions
        const paragraphs = document.querySelectorAll('p, div, section');
        let content = [];
        
        for (const element of paragraphs) {
          const text = element.innerText || '';
          if (text.length > 100 && (
              text.toLowerCase().includes('responsibilities') ||
              text.toLowerCase().includes('requirements') ||
              text.toLowerCase().includes('qualifications') ||
              text.toLowerCase().includes('about this job') ||
              text.toLowerCase().includes('job description') ||
              text.toLowerCase().includes('what you'll do')
          )) {
            content.push(text);
          }
        }
        
        if (content.length > 0) {
          jobDescription = content.join('\n\n');
        }
      }
    }
    
    // Send the extracted job description back to popup
    sendResponse({ jobDescription: jobDescription });
  }
  return true; // Indicates that the response will be sent asynchronously
});