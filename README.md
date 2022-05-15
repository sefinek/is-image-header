## 🌍 » What is that?
This module checks if the URL leads to a photo by analyzing the header.

## ⚠️ » Warning
Remember that your IP address will be exposed! The module uses [axios](https://www.npmjs.com/package/axios).

## 🤔 » Installation
> **$** npm install is-image-header

## 📝 » Usage
### • Async/await example
```js
const isImage = require('is-image-header');

(async () => {
    console.log(await isImage('https://cdn.skiffybot.xyz/images/animals/cat/cat-story-25-1377426-min.jpg')); // true
    console.log(await isImage('https://api.skiffybot.xyz')); // false
})();
```

### • Promise example
```js
const isImage = require('random-cat-img');

isImage('https://cdn.skiffybot.xyz/images/animals/cat/cat-story-25-1377426-min.jpg').then(data => console.log(data)); // true
isImage('https://api.skiffybot.xyz').then(data => console.log(data)); // false
```

## 🤝 » Help
Open new [Issue](https://github.com/sefinek24/is-image-header/issues/new/choose) on GitHub.