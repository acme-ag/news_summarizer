browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'summarize') {
    console.log(`Received content to summarize with ${request.model}:`, request.content);
    
    if (request.model === 'Mistral 7B') {
      return summarizeWithMistral(request.content, sendResponse);
    } else if (request.model === 'ChatGPT') {
      return summarizeWithChatGPT(request.content, sendResponse);
    } else {
      sendResponse({ error: 'Invalid model specified' });
    }
  }
});

function summarizeWithMistral(content, sendResponse) {
  const ollamaRequest = {
    model: "mistral",
    prompt: `Summarize the following text:\n\n${content}`,
    stream: false
  };

  fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ollamaRequest)
  })
  .then(response => response.json())
  .then(data => {
    if (data && data.response) {
      sendResponse({ summary: data.response });
    } else {
      throw new Error('Unexpected response format from Ollama');
    }
  })
  .catch(error => {
    console.error('Error calling Ollama:', error);
    sendResponse({ error: `Failed to generate summary. Error: ${error.message}` });
  });

  return true;  // Indicate asynchronous response
}

function summarizeWithChatGPT(content, sendResponse) {
  const apiKey = 'YOUR_API_KEY';  // Replace with your OpenAI API key for selected model

  const chatgptRequest = {
    model: "gpt-4o-mini",  // You can also use "gpt-3.5-turbo" or "gpt-4", "gpt-4o" if you prefer. check platform.openai.com
    messages: [
      { role: "system", content: "You are a helpful assistant that summarizes news articles." },
      { role: "user", content: `Summarize the following text:\n\n${content}` }
    ],
    max_tokens: 500,
    temperature: 0.7
  };

  fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(chatgptRequest)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (data && data.choices && data.choices[0].message.content) {
      sendResponse({ summary: data.choices[0].message.content });
    } else {
      throw new Error('Unexpected response format from OpenAI');
    }
  })
  .catch(error => {
    console.error('Error calling OpenAI:', error);
    sendResponse({ error: `Failed to generate summary. Error: ${error.message}` });
  });

  return true;  // Indicate asynchronous response
}
