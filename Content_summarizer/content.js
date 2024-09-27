console.log('Content script loaded');

function extractMainContent() {
    console.log('Extracting content from page');
    
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
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          // Ignore content from specific tags
          const ignoredTags = ['script', 'style', 'nav', 'header', 'footer', 'aside', 'figure', 'blockquote', 'iframe'];
          if (!ignoredTags.includes(child.tagName.toLowerCase())) {
            text += getTextContent(child) + ' ';
          }
        }
      }
      return text.trim();
    }
  
    function scoreElement(element) {
      const text = getTextContent(element);
      const wordCount = text.split(/\s+/).length;
      const linkDensity = element.getElementsByTagName('a').length / wordCount;
      const imageCount = element.getElementsByTagName('img').length;
      
      // penalize elements with high link density or too many images
      const readabilityScore = wordCount * (1 - linkDensity - 0.1 * imageCount);
      
      // Bonus for elements with certain classes or IDs
      const bonusClasses = ['article', 'post', 'entry', 'content'];
      const bonusIds = ['main-content', 'article-body', 'post-content'];
      
      let bonus = 0;
      bonusClasses.forEach(className => {
        if (element.classList.contains(className)) bonus += 50;
      });
      bonusIds.forEach(id => {
        if (element.id === id) bonus += 100;
      });
      
      return readabilityScore + bonus;
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
  
    // If no content found, fall back to body text
    if (!bestElement) {
      console.log('No specific content area found, using body text');
      bestElement = document.body;
    }
  
    let content = getTextContent(bestElement);
  
    // Clean up the content
    content = content.replace(/\s+/g, ' ').trim();
    content = content.replace(/\[.*?\]/g, ''); // Remove square brackets content
    content = content.replace(/\(https?:\/\/[^\s\)]+\)/g, ''); // Remove URLs in parentheses
    content = content.replace(/Related Articles|You may also like|Editor's picks|Editor's choice|Recommended|Trending Now|Popular Stories|More From|Suggested Reading|Top Stories|In Case You Missed It|From Around the Web|Sponsored Content|Featured Articles|Most Read|Similar Stories|Explore Further/gi, ''); // filter common unrelated sections/blocks
  
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
    return true; // enable async response
});
