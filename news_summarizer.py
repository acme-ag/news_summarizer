# small news summarizer
# edit relevant classes and other elements that are specific for a site
# first run: creates empty data.json file. Edit it to add resources (say, news lists) in .json format
# all the following runs it checks for updates and summarizes

import requests
from bs4 import BeautifulSoup
from dateutil.parser import parse
from datetime import datetime, timedelta
from urllib.parse import urlparse
import json

# this is just to put dom.name into subtitles in the summary
def get_domain(url):
    parsed_url = urlparse(url)
    domain = parsed_url.netloc
    return domain


def fetch_page(url):
    response = requests.get(url)
    response.raise_for_status()
    return response.text


# Here and in the next chunks we add some specific selectors for some entities
def parse_page(html):  # Select article body
    soup = BeautifulSoup(html, 'html.parser')
    return soup.find_all('article', class_=['mh-posts-list-item', 'component-listing-card'])


def extract_header(article):
    header_element = article.find(['h3', 'h2'], class_='entry-title')  # Select article header
    return header_element.find('a').get_text() if header_element else None


def extract_date(article):
    date_element = article.find(['span', 'time'], class_=['entry-meta-date', 'entry-date'])  # Find date
    if date_element:
        date_text = date_element.get_text() if date_element.name == 'time' else date_element.find('a').get_text()
        try:
            return parse(date_text)
        except ValueError:
            return None
    return None


def extract_text_and_url(article):
    url = None
    text = None
    link_element = article.find('a')
    if link_element:
        url = link_element.get('href')
    
    excerpt_div = article.find('div', class_='mh-excerpt')
    if excerpt_div:
        paragraph = excerpt_div.find('p')
        if paragraph:
            text = paragraph.get_text()
    
    return text, url


# These sites are not very frequently updated and we don't want to spam ourselves so... 7 days is ok
# also check if the url already was in prev. summary, if exists in urls, then skip
def check_new_content(articles, exist_urls, days=7):
    new_articles = []
    threshold_date = datetime.now() - timedelta(days=days)
    for article in articles:
        date = extract_date(article)
        text, url = extract_text_and_url(article)
        if date and date > threshold_date and url not in exist_urls:
            header = extract_header(article)
            if url:
                new_articles.append((header, text, url, date))
    return new_articles


# set resources aand check for existing content (summarized earlier)
def load_data(filename='data.json'):
    try:
        with open(filename, 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        return {"resources": [], "urls": []}


def save_data(data, filename='data.json'):
    with open(filename, 'w') as file:
        json.dump(data, file, indent=4)


# Put everything together
def main(url, exist_urls):
    html = fetch_page(url)
    articles = parse_page(html)
    new_articles = check_new_content(articles, exist_urls)
    return [url for _, _, url, _ in new_articles] if new_articles else None, [url for _, _, url, _ in new_articles]


def process_links(links, exist_urls):
    all_results = {}
    new_urls = []
    for link in links:
        result, new_article_urls = main(link, exist_urls)
        if result:
            all_results[link] = result
            new_urls.extend(new_article_urls)
    return all_results, new_urls


#-------------------- set model ----------------------
# use a local ollama model

def get_response(prompt, model="mistral"):

    # set API endpoint and data dictionary
    url = "http://localhost:11434/api/generate"
    data = {
        "model": model,
        "prompt": prompt
    }
    
    # send post request with query as json
    try:
        response = requests.post(url, json=data, stream=True)
        response.raise_for_status()
        
        full_response = ""
        for line in response.iter_lines(decode_unicode=True):
            if line:
                try:
                    response_data = json.loads(line)
                    full_response += response_data.get("response", "")
                    if response_data.get("done", False):
                        break
                except json.JSONDecodeError:
                    print(f"Failed to decode JSON: {line}")
        
        return full_response.strip()
    
    except requests.RequestException as e:
        print(f"Failed to generate request: {e}")
        return None

# set prompt, call model    
def run_input(text):
    prompt = f'Give me 150 word summary of the text {text}'
    response = get_response(prompt)
    return response



# ----------------------- process ----------------
if __name__ == '__main__':
    
    data = load_data()

    input_list = data.get("resources", [])
    exist_urls = set(data.get("urls", []))

    results, new_urls = process_links(input_list, exist_urls)
    articles_dict = {}
    
    if results:
        for link, articles in results.items():
            domain = get_domain(link)
            articles_dict[domain] = articles
            print(f"New articles from {domain}:")
            for article in articles:
                print(f"  - {article}")
            print()
    else:
        print("No new content this time.")   

    summary_list = []
    for domain, links in articles_dict.items():
        summary_list.append(f"New articles from {domain}:")
        for link in links:
            summary = run_input(link)
            summary_list.append(summary)
            summary_list.append(link)
            summary_list.append('--------------')
        summary_list.append('\n')

    for line in summary_list:
        print(line)

    # Save new URLs after processing
    data["urls"].extend(new_urls)
    save_data(data)
