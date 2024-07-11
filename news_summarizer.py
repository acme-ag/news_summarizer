import requests
from bs4 import BeautifulSoup
from dateutil.parser import parse
from datetime import datetime, timedelta
from urllib.parse import urlparse
import json


def get_domain(url):
    parsed_url = urlparse(url)
    domain = parsed_url.netloc
    return domain


def fetch_page(url):
    response = requests.get(url)
    response.raise_for_status()
    return response.text


# here and in the next chunks we add some specific selectors for some entities
def parse_page(html):  # select article body
    soup = BeautifulSoup(html, 'html.parser')
    return soup.find_all('article', class_=['mh-posts-list-item', 'component-listing-card'])


def extract_header(article):
    header_element = article.find(['h3', 'h2'], class_='entry-title')  # select article header
    return header_element.find('a').get_text() if header_element else None


def extract_date(article):
    date_element = article.find(['span', 'time'], class_=['entry-meta-date', 'entry-date'])  # find date
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


# these sites are not very frequently updated and we don't want to spam ourselves so... 7 days is ok
def check_new_content(articles, days=7):
    new_articles = []
    threshold_date = datetime.now() - timedelta(days=days)
    for article in articles:
        date = extract_date(article)
        if date and date > threshold_date:
            text, url = extract_text_and_url(article)
            h = extract_header(article)
            if url:
                new_articles.append((h, text, url, date))
    return new_articles


# put everything together
def main(url):
    html = fetch_page(url)
    articles = parse_page(html)
    new_articles = check_new_content(articles)
    return [url for _, _, url, _ in new_articles] if new_articles else None


def process_links(links):
    all_results = {}
    for link in links:
        result = main(link)
        if result:
            all_results[link] = result
    return all_results


# This code is adapted from source: https://github.com/bdytx5/m1_mistral_local/blob/148e84069ff322da462e5f713ad28f16bb5c2256/ollama_py.py
def get_response(prompt, model="mistral"):
    url = "http://localhost:11434/api/generate"
    data = {
        "model": model,
        "prompt": prompt
    }
    
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


def run_input(text):
    prompt = f'Give me 150 word summary of the text {text}'
    response = get_response(prompt)
    return response             


if __name__ == '__main__':
    with open('resources.txt', 'r') as file:
        input_list = [line.strip() for line in file.readlines() if line.strip()]

    results = process_links(input_list)
    articles_dict = {}
    
    if results:
        for link, articles in results.items():
            domain = get_domain(link)
            articles_dict[domain] = articles
            print(f"New articles from {get_domain(link)}:")
            for article in articles:
                print(f"  - {article}")
            print()
    else:
        print("No new articles found from any of the links.")   

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