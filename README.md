# 🌍 » What does it do?
This simple module checks if the given link leads to an image.

## 🤔 » Installation
```bash
npm install is-image-header
```

## 📝 » Usage
### • Async/await example
```js
const isImage = require('is-image-header');

(async () => {
    const example1 = await isImage('https://cdn.sefinek.net/images/animals/cat/cat-story-25-1377426-min.jpg');
    console.log(example1); // { success: true, status: 200, isImage: true }

    const example2 = await isImage('https://sefinek.net');
    console.log(example2); // { success: true, status: 200, isImage: false }
})();
```

### • Promise example
```js
const isImage = require('is-image-header');

isImage('https://cdn.sefinek.net/images/animals/cat/cat-story-25-1377426-min.jpg').then(console.log); // { success: true, status: 200, isImage: true }
isImage('https://sefinek.net').then(console.log); // { success: true, status: 200, isImage: false }
```

## 🤝 » Support
Join our [Discord server](https://discord.gg/53DBjTuzgZ) or open a new [Issue](https://github.com/sefinek/is-image-header/issues).

## ⭐ » Star
If you enjoy this module, please consider starring [the repository](https://github.com/sefinek/is-image-header).

## 📜 » License
Copyright © [Sefinek](https://sefinek.net). Licensed under the [MIT License](LICENSE).
