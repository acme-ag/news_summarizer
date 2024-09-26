An update on SafariExt Summarizer:

Now one can choose what model to use: 
- local (free) Mistral LLM 7b which is good at summarization, free, but a bit slower -- it takes about 10 seconds to summarize a ~200 comments Reddit thread or a news/article of an average size (i don't want to divee into and calculate tokens).
- ChatGPT through API -- in this case you'd need an API key, but it works 3-4 times faster.
Can't say there's a great difference in quality of performance. What's good -- it almost omnivorous, so far I see  it stumbles on the very old sites. Sometimes it needs to tinker the content selector in content.js.

![content summarizer](Balloon_Ride_to_Space_1)
![content summarizer](Balloon_Ride_to_Space_Mistral)
![content summarizer](Balloon_Ride_to_Space_GPT)
