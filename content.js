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
    else if (window.location.hostname.includes('greenhouse.io')) {
      // Greenhouse.io job extraction - specifically targeted
      console.log("Greenhouse.io site detected");
      
      // Get the job content from the #content div which contains the job description
      // First attempt - try to get main job description sections
      const jobDescriptionDiv = document.getElementById('gh-job-content');
      if (jobDescriptionDiv) {
        console.log("Found the greenhouse job content div");
        jobDescription = jobDescriptionDiv.innerText || '';
      }
      
      // If that doesn't work, try another approach specifically for Greenhouse
      if (!jobDescription || jobDescription.length < 100) {
        console.log("Using alternative Greenhouse extraction");
        
        // Try to find the job content container
        const contentContainer = document.querySelector('.content');
        
        if (contentContainer) {
          // Get all paragraphs and list elements inside the content
          const elements = contentContainer.querySelectorAll('p, ul, ol, li, div');
          let extractedText = [];
          
          elements.forEach(el => {
            const text = el.innerText.trim();
            if (text && text.length > 10) {
              extractedText.push(text);
            }
          });
          
          if (extractedText.length > 0) {
            jobDescription = extractedText.join('\n\n');
          }
        }
      }
      
      // Final fallback for Greenhouse
      if (!jobDescription || jobDescription.length < 200) {
        // Just get everything from the main content area
        const mainContent = document.querySelector('#app-container') || document.querySelector('#main');
        if (mainContent) {
          console.log("Using fallback main content extraction");
          jobDescription = mainContent.innerText;
          
          // Try to clean up the text to remove headers, footers, etc.
          const lines = jobDescription.split('\n');
          const cleanedLines = lines.filter(line => 
            line.trim().length > 0 && 
            !line.includes('Apply for this job') &&
            !line.includes('Apply Now') &&
            !line.includes('Share:') &&
            !line.includes('Greenhouse')
          );
          
          jobDescription = cleanedLines.join('\n');
        }
      }
    }
    
    // If still no job description, use generic approach
    if (!jobDescription) {
      console.log("Using generic extraction approach");
      
      // Try common job description selectors
      const possibleSelectors = [
        '.job-description',
        '#job-description',
        '[data-testid="jobDescriptionText"]',
        '.description',
        '.job-details',
        '#job-details',
        '.jobSectionHeader',
        '.job-info',
        '.listing-description',
        '[class*="description"]', // Any class containing "description"
        '[id*="description"]'     // Any id containing "description"
      ];
      
      for (const selector of possibleSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          jobDescription = element.innerText;
          console.log("Found job description with selector: ", selector);
          break;
        }
      }
      
      // If still not found, try a more aggressive approach
      if (!jobDescription) {
        console.log("Using keyword-based extraction approach");
        
        // First look for headings that might indicate job description sections
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6, strong, b');
        let descriptionSection = null;
        
        for (const heading of headings) {
          const headingText = heading.innerText.toLowerCase();
          if (headingText.includes('job description') || 
              headingText.includes('responsibilities') || 
              headingText.includes('requirements') ||
              headingText.includes('qualifications') ||
              headingText.includes('what you'll do') ||
              headingText.includes('about the role')) {
            // Found a relevant heading, now get the content that follows
            let currentElement = heading.nextElementSibling;
            let sectionContent = [];
            
            // Collect content until the next heading or end of parent
            while (currentElement && 
                  !['H1','H2','H3','H4','H5','H6'].includes(currentElement.tagName)) {
              if (currentElement.innerText && currentElement.innerText.trim()) {
                sectionContent.push(currentElement.innerText);
              }
              currentElement = currentElement.nextElementSibling;
            }
            
            if (sectionContent.length > 0) {
              descriptionSection = sectionContent.join('\n');
              break;
            }
          }
        }
        
        // If we found a section by heading, use that
        if (descriptionSection) {
          jobDescription = descriptionSection;
        } else {
          // Otherwise, look for content blocks with relevant keywords
          const paragraphs = document.querySelectorAll('p, div, section');
          let content = [];
          
          for (const element of paragraphs) {
            const text = element.innerText || '';
            if (text.length > 80 && (
                text.toLowerCase().includes('responsibilities') ||
                text.toLowerCase().includes('requirements') ||
                text.toLowerCase().includes('qualifications') ||
                text.toLowerCase().includes('about this job') ||
                text.toLowerCase().includes('job description') ||
                text.toLowerCase().includes('what you'll do') ||
                text.toLowerCase().includes('ideal candidate') ||
                text.toLowerCase().includes('we're looking for') ||
                text.toLowerCase().includes('we are looking for')
            )) {
              content.push(text);
            }
          }
          
          if (content.length > 0) {
            jobDescription = content.join('\n\n');
          } else {
            // Last resort: just grab the main content area
            const mainContent = document.querySelector('main') || document.querySelector('article');
            if (mainContent) {
              jobDescription = mainContent.innerText;
            }
          }
        }
      }
    }
    
    // Clean up the job description
    if (jobDescription) {
      // Remove excessive whitespace
      jobDescription = jobDescription.replace(/\n{3,}/g, '\n\n');
      
      // Remove common footer/header text if it's long enough to be meaningful
      if (jobDescription.length > 300) {
        // Try to find key sections by looking for patterns
        const sections = jobDescription.split(/\n{2,}/);
        const relevantSections = sections.filter(section => 
          !section.includes('Apply now') && 
          !section.includes('Save this job') &&
          !section.includes('Similar jobs') &&
          !section.includes('copyright') &&
          !section.includes('©') &&
          !section.includes('Privacy Policy')
        );
        
        if (relevantSections.length > 0) {
          jobDescription = relevantSections.join('\n\n');
        }
      }
    }
    
    console.log("Final job description length: ", jobDescription.length);
    
    // Send the extracted job description back to popup
    sendResponse({ jobDescription: jobDescription });
  }
  return true; // Indicates that the response will be sent asynchronously
});