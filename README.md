# Resume Customizer Chrome Extension

A Chrome extension that helps customize your resume based on job descriptions using AI-powered analysis.

## Features

- Upload and store your resume content
- Extract job descriptions automatically from popular job sites
- Customize your resume with a single click using n8n-based AI workflow
- Copy or download the customized resume

## Installation

### Development Mode

1. Clone this repository:
   ```
   git clone https://github.com/ghodeaniket/resume-customizer-extension.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" using the toggle in the top-right corner

4. Click "Load unpacked" and select the extension directory

5. The extension should now appear in your browser toolbar

### Configuration

1. Update the n8n server URL in `popup.js` if needed
2. Make sure your n8n workflow is running with the proper webhook configuration

## How to Use

1. Click on the extension icon in your browser toolbar
2. Setup tab: Paste your resume content and save it
3. Customize tab: 
   - Navigate to a job description page
   - Click "Extract from Page" to automatically extract the job description
   - Or manually paste the job description
   - Click "Customize Resume" to process it with AI
4. Result tab: View, copy, or download your customized resume

## Technology Stack

- Chrome Extension API
- JavaScript
- n8n workflow backend with AI integration

## License

MIT