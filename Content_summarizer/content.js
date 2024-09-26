console.log('Content script loaded');

function extractMainContent() {
    console.log('Extracting content from page');
    
    // set add more elsectorsa
    const selectors = [
      'article', 'main', '.post', '.entry-content', '.article-body', '#content', '.content',
      '.post-content', '.single-post', '.entry', '.article', '.prose', '.entry-content',
      '[itemprop="articleBody"]', '.blog-post', '.news-article', '.story-content'
    ];
    
    let bestElement = null;
    let bestScore = 0;
  
    function getTextContent(element) {
      let text = '';
      if (element.childNodes.length === 0) {
        return element.textContent.trim();
      }
      for (let child of element.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          text += child.textContent.trim() + ' ';
        } else if (child.nodeType === Node.ELEMENT_NODE && !['script', 'style', 'nav', 'header', 'footer', 'aside', 'figure', 'blockquote'].includes(child.tagName.toLowerCase())) {
          text += getTextContent(child) + ' ';
        }
      }
      return text.trim();
    }
  
    function scoreElement(element) {
      const text = getTextContent(element);
      const wordCount = text.split(/\s+/).length;
      const linkDensity = element.getElementsByTagName('a').length / wordCount;
      const imageCount = element.getElementsByTagName('img').length;  // penalize image-heavy content
      const readabilityScore = wordCount * (1 - linkDensity - 0.1 * imageCount);  // adjust the scoring
      return readabilityScore;
    }
  
    // try each selector 1 by 1
    for (let selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (let element of elements) {
        const score = scoreElement(element);
        if (score > bestScore) {
          bestScore = score;
          bestElement = element;
        }
      }
    }
  
    // if no content found -- fall back to body text
    if (!bestElement) {
      console.log('No specific content area found, using body text');
      bestElement = document.body;
    }
  
    let content = getTextContent(bestElement);
  
    // clean up the content
    content = content.replace(/\s+/g, ' ').trim();
    content = content.replace(/\[.*?\]/g, ''); // remove square brackets content
    content = content.replace(/\(https?:\/\/[^\s\)]+\)/g, ''); // here remove URLs in parentheses
    content = content.replace(/Related Articles|You may also like/gi, ''); // filter common unrelated sections (we want main body texxt in the summary. That's mostly for Mistral, since it has some difficulties with distinguishing main body text and ads, related and other texts if they are in the same content element as main text.
  
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
