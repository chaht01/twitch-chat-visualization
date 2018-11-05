# TWitch TV Chat log Visualization

As streaming service holds mainstream of media, analyzing viewer's behavior has many interesting features. Especially, this project focuses on chat log to observe group behavior to see video more interesting way.



![Demo](https://i.imgur.com/08Mzl0E.png)(https://youtu.be/BpXlKcvVxZE)



## Abstraction

This study deals with the visualization work that can visually express, search and analyze the main scene of the video from the video streaming of the game which is recently combined with the chat. Chat used as a window of user response can be effective not only in the amount of simple feeds, but also in presenting meaningful criteria for analyzing videos based on the words used. This study devised and implemented a visualization that will accomplish the goals that will help the audience after collecting the most frequently mentioned words from video chats. The data to be used in the research was collected through twitch tv, parsed by Python, and implemented using stacked bar chart, tree map, and Volume-Bias chart using d3.js and html canvas. The result of this study is available at http://twitch.hyuntak.com.

## Which parts this project can contribute?

1. Which part of the video was the most responsive
2. What are the words that people often mention in a particular clip?
3. How intense is the mention of a particular word?



## Takeaway

- Displaying 10,000+ rect and supporting brushing interaction
- Video & Chat real-time sync
- Volume-Bias Chart Idiom



## How to execute

Visit http://twitch.hyuntak.com



## Built With

- [d3js](https://d3js.org/) - Chart frameworks

- [Angularjs](https://angularjs.org/) - Main frontend frameworks

  ​

## Authors

- **Hyuntak Cha** - *Maintainer* - [website](https://hyuntak.com)



## Acknowledgments

- https://engineering.mongodb.com/post/d3-round-two-how-to-blend-html5-canvas-with-svg-to-speed-up-rendering
