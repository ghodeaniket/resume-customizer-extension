# Required Changes to n8n Workflow

To properly integrate with the Chrome extension, your n8n workflow needs the following changes:

## 1. Webhook Configuration

Update the webhook node in your n8n workflow:

```json
{
  "parameters": {
    "httpMethod": "POST",
    "path": "customize-resume",
    "responseMode": "responseNode",
    "options": {
      "rawBody": true,
      "responseHeaders": {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-API-Key"
      }
    }
  },
  "name": "Webhook"
}
```

## 2. Response Format

Update the "Respond to Webhook" node to return a proper JSON response:

```json
{
  "parameters": {
    "respondWith": "json",
    "responseBody": {
      "status": "success",
      "data": {
        "customizedResume": "={{ $json.text }}"
      }
    },
    "options": {
      "responseCode": 200
    }
  },
  "name": "Respond to Webhook"
}
```

This ensures that the response from n8n has the format:

```json
{
  "status": "success",
  "data": {
    "customizedResume": "Your customized resume content here..."
  }
}
```

## 3. Input Validation and Error Handling

Add a node after the webhook to validate inputs:

```javascript
// Check if required fields are present
if (!$input.body.jobDescription || !$input.body.resumeContent) {
  return {
    json: {
      status: 'error',
      message: 'Missing required fields: jobDescription and/or resumeContent'
    }
  };
}

// If valid, pass the data to the next node
return {
  json: {
    body: {
      jobDescription: $input.body.jobDescription,
      resumeContent: $input.body.resumeContent
    }
  }
};
```

## 4. Processing Status Updates (Optional Future Enhancement)

For a more sophisticated implementation in the future, you could add a way to check the processing status:

1. Add a Function node that generates a unique ID for each job
2. Store the job details in n8n's execution data or an external database
3. Add a second webhook endpoint that allows checking the status of a job by ID

This would allow the extension to poll for status updates while processing is happening.

## 5. Security Considerations

If you want to add authentication:

1. Uncomment the X-API-Key header in the extension code
2. Add validation in an early n8n node:

```javascript
if ($input.headers['x-api-key'] !== 'resume-customizer-key') {
  return {
    json: {
      status: 'error',
      message: 'Unauthorized: Invalid API key'
    }
  };
}
```

## 6. Testing Your Workflow

You can test your workflow directly with curl:

```bash
curl -X POST https://n8n.cognitoapps.in/webhook/customize-resume \
  -H "Content-Type: application/json" \
  -d '{
    "jobDescription": "Example job description", 
    "resumeContent": "Example resume content"
  }'
```

The response should have the format shown in section 2 above.
