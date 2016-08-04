# wall-spider
A node module that allows for easy crawling of Facebook pages, posts and comments.

### Installation
```
npm install wall-spider
```

### Usage
First add the require for wall-spider and set the API token, which can be generated [here](https://developers.facebook.com/tools/explorer).
```js
// Get all posts from a wall.
var wallSpider = require("wall-spider");
wallSpider.setApiToken("YOURAPITOKENHERE");
```
Then pick a page, post or comment you want to crawl and call crawlNode.
```js
wallSpider.crawlNode("GitHub", "page").then(function(posts){
    // You have the posts, do what you will.
});
```
And you'll receive something like this:
```js
[{
  id: "1", // ID of a post on the page
  message: "Hello world!", // Content of the post.
  by: "Aelexe", // Name of user/page that made the post
  createdTime: 1470167581, // Creation epoch time.
  readableTime: "Wed Aug 03 2016 07:53:01 GMT+1200 (New Zealand Standard Time)" // Creation readable time.
}]
```
