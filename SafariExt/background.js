//browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
//    if (request.action === 'summarize') {
//        console.log('Received content to summarize:', request.content);
//        
////        const mistralRequest = {
////            model: "mistral",  // Using Mistral model as in the Python function
////            prompt: `Summarize the following text:\n\n${request.content}`,  // Adjusted prompt
////            stream: false
////        };
//        const mistralRequest = {
//            model: "mistral",
//            prompt: `Summarize the following text:\n\n${request.content}\n\nSummary:`,
//            options: {
//                temperature: 0.7,
//                max_tokens: 500,
//                top_p: 0.95,
//                top_k: 50,
//                repetition_penalty: 1.0,
//                stop: []
//            },
//            cache: true
//        };
//
//        console.log('Sending request to Mistral 7b:', mistralRequest);
//
//        // Keep the URL as 'localhost' even though the server is bound to 0.0.0.0
//        fetch('http://localhost:11434/api/generate', {
//            method: 'POST',
//            headers: {
//                'Content-Type': 'application/json',
//            },
//            body: JSON.stringify(mistralRequest)
//        })
//        .then(response => {
//            console.log('Received response from Ollama:', response);
//            if (!response.ok) {
//                throw new Error(`HTTP error! status: ${response.status}`);
//            }
//            return response.json();
//        })
//        .then(data => {
//            console.log('Received summary from Mistral 7b:', data);
//            sendResponse({ summary: data.response });
//        })
//        .catch(error => {
//            console.error('Error calling Mistral 7b:', error);
//            sendResponse({ error: `Failed to generate summary. Error: ${error.message}` });
//        });
//
//        return true;  // Keep the message channel open for asynchronous response
//    }
//});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'summarize') {
        console.log('Received content to summarize:', request.content);
        
        const mistralRequest = {
            model: "mistral",
            prompt: `Summarize the following text:\n\n${request.content}\n\nSummary:`,
            stream: false
        };

        console.log('Sending request to Mistral 7b:', mistralRequest);

        fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(mistralRequest)
        })
        .then(response => {
            console.log('Received response from Ollama:', response);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text(); // Get the raw text instead of parsing JSON immediately
        })
        .then(text => {
            console.log('Raw response text:', text);
            try {
                const data = JSON.parse(text);
                console.log('Parsed JSON data:', data);
                if (data.response) {
                    sendResponse({ summary: data.response });
                } else {
                    throw new Error('Response does not contain expected "response" field');
                }
            } catch (error) {
                throw new Error(`Failed to parse response: ${error.message}\nRaw response: ${text}`);
            }
        })
        .catch(error => {
            console.error('Error calling Mistral 7b:', error);
            sendResponse({ error: `Failed to generate summary. Error: ${error.message}` });
        });

        return true;
    }
});
