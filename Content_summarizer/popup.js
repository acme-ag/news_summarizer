function summarize(model) {
    console.log(`Summarize button clicked for ${model}`);
    
    const summaryDiv = document.getElementById('summary');
    const loadingDiv = document.getElementById('loading');
    const summarizeButtons = document.querySelectorAll('button[id^="summarize-"]');
    
    summarizeButtons.forEach(button => button.style.display = 'none');
    summaryDiv.style.display = 'none';
    loadingDiv.style.display = 'block';
    
    summaryDiv.textContent = 'Extracting content...';

    browser.tabs.query({ active: true, currentWindow: true })
        .then(tabs => {
            console.log('Sending message to content script');
            return browser.tabs.sendMessage(tabs[0].id, { action: 'extractContent' });
        })
        .then(response => {
            console.log('Received response from content script:', response);
            if (response && response.text) {
                console.log('Extracted content length:', response.text.length);
                summaryDiv.textContent = `Summarizing with ${model}...`;
                return browser.runtime.sendMessage({ action: 'summarize', content: response.text, model: model });
            } else {
                throw new Error('No content extracted. The page might be using a non-standard structure.');
            }
        })
        .then(summaryResponse => {
            console.log('Received summary:', summaryResponse);
            if (summaryResponse && summaryResponse.summary) {
                summaryDiv.textContent = summaryResponse.summary;
                summaryDiv.style.display = 'block';
                loadingDiv.style.display = 'none';
                document.getElementById('copy').style.display = 'flex';
            } else if (summaryResponse && summaryResponse.error) {
                throw new Error(summaryResponse.error);
            } else {
                throw new Error('No summary received. There might be an issue with the summarization process.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            summaryDiv.textContent = 'Error: ' + error.message;
            summaryDiv.style.display = 'block';
            loadingDiv.style.display = 'none';
            summarizeButtons.forEach(button => button.style.display = 'block');
        });
}

document.getElementById('summarize-mistral').addEventListener('click', () => summarize('Mistral 7B'));
document.getElementById('summarize-chatgpt').addEventListener('click', () => summarize('ChatGPT'));

document.getElementById('copy').addEventListener('click', () => {
    const summaryDiv = document.getElementById('summary');
    const summaryText = summaryDiv.textContent;

    if (summaryText) {
        const copyImage = document.querySelector('#copy img');
        copyImage.style.filter = 'contrast(10%)';

        navigator.clipboard.writeText(summaryText)
            .then(() => {
                console.log('Summary copied to clipboard');
                alert('Summary copied to clipboard!');
            })
            .catch(err => {
                console.error('Error copying text: ', err);
            });
    } else {
        alert('No summary available to copy.');
    }
});
