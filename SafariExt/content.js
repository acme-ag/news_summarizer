console.log('Content script loaded');

function extractMainContent() {
    console.log('Extracting content from page');
    let content = '';

    // array of selectors to try, add some more later
    const selectors = [
        'article',
        'main',
        '.main-content',
        '#main-content',
        '.post-content',
        '#post-content',
        '.entry-content',
        '#content',
        '.content'
    ];

    // try each selector 1-by-1
    for (let selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            console.log(`Found content using selector: ${selector}`);
            content = element.innerText;
            break;
        }
    }

    // ff no content found -- fall back to body text
    if (!content) {
        console.log('No specific content area found, using body text');
        // Remove script and style elements
        const bodyClone = document.body.cloneNode(true);
        const scriptStyles = bodyClone.querySelectorAll('script, style');
        scriptStyles.forEach(el => el.remove());
        content = bodyClone.innerText;
    }

    // clean up the content
    content = content.replace(/\s+/g, ' ').trim();

    console.log('Extracted content length:', content.length);
    return content;
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message in content script:', request);

    if (request.action === 'extractContent') {
        console.log('Extracting content based on message');
        const content = extractMainContent();
        console.log('Sending response with content length:', content.length);
        sendResponse({ text: content });
    }
    return true; // enable async. response
});
