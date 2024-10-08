# An update on SafariExt Summarizer:

Now one can choose what model to use: 
- **Local (free) Mistral LLM 7b** which is good at summarization, free, but a bit slower -- it takes about 10 seconds (with Ollama on macbook, CPU-only) to summarize a ~200 comments Reddit thread or a news/article of an average size.
- **ChatGPT through API** -- in this case you'd need an API key, but it works 3-4 times faster.

I can’t say there’s a significant difference in performance quality on moderately sized texts. However, for larger texts, the Mistral context window might not be sufficient, making ChatGPT a better option. What's good -- it almost omnivorous, so far I see  it stumbles on the very old sites or some social media platfforms where it's confusing what part has higher weight -- post or comment. Sometimes it needs to tinker the content selector in content.js. Anyway, I made it for practice and to make summaries of longer and verbose texts comfortably.



![content summarizer](Balloon_Ride_to_Space_1.jpg)


---------------
### With Mistral 7B
![content summarizer](Balloon_Ride_to_Space_Mistral.jpg)

----------------
### With ChatGPT 4o-mini
![content summarizer](Balloon_Ride_to_Space_GPT.jpg)
