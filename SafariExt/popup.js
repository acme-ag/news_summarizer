document.getElementById('summarize').addEventListener('click', () => {
    console.log('Summarize button clicked');
    
    const summaryDiv = document.getElementById('summary');
    const loadingDiv = document.getElementById('loading');
    const summarizeButton = document.getElementById('summarize'); // Select the button
    
    // hide the "Summarize" button
    summarizeButton.style.display = 'none';

    // hide the summary and show the loading.gif bar
    summaryDiv.style.display = 'none';
    loadingDiv.style.display = 'block';
    
    // set temporary message while content is being extracted
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
                summaryDiv.textContent = 'Summarizing with Mistral 7b...';
                return browser.runtime.sendMessage({ action: 'summarize', content: response.text });
            } else {
                throw new Error('No content extracted. The page might be using a non-standard structure.');
            }
        })
        .then(summaryResponse => {
            console.log('Received summary:', summaryResponse);
            if (summaryResponse && summaryResponse.summary) {
                // here  change the h1 text to jsut "Summary"
                document.querySelector('h1').textContent = 'Summary'; // Uudate the h1 text

                // show the summary and hide the loading bar
                summaryDiv.textContent = summaryResponse.summary;
                summaryDiv.style.display = 'block';
                loadingDiv.style.display = 'none';
                
                // show the "copy" button after summary is generated
                document.getElementById('copy').style.display = 'flex'; // show the button
            } else if (summaryResponse && summaryResponse.error) {
                throw new Error(summaryResponse.error);
            } else {
                throw new Error('No summary received. There might be an issue with the summarization process.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            summaryDiv.textContent = 'Error: ' + error.message +
                '\n\nPlease ensure Ollama is running and try again.';
            summaryDiv.style.display = 'block';
//            loadingDiv.style.display = 'none'; // hide loading gif in case of an error
        });
});

// add event listener for the "copy" but.
document.getElementById('copy').addEventListener('click', () => {
    const summaryDiv = document.getElementById('summary');
    const summaryText = summaryDiv.textContent;

    if (summaryText) {
        // change CSS property for the image when the button is clicked
        const copyImage = document.querySelector('#copy img');
        copyImage.style.filter = 'contrast(10%)'; // apply button change when clicked behaviour

        navigator.clipboard.writeText(summaryText)
            .then(() => {
                console.log('Summary copied to clipboard');
                //   show a notification or alert
                alert('Summary copied to clipboard!');
            })
            .catch(err => {
                console.error('Error copying text: ', err);
            });
    } else {
        alert('No summary available to copy.');
    }
});
