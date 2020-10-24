# Databasetify
A new, easier way to database

![GitHub package.json version](https://img.shields.io/github/package-json/v/GianlucaTarantino/databasetify?style=flat-square) ![GitHub](https://img.shields.io/github/license/GianlucaTarantino/databasetify?style=flat-square) ![npm bundle size](https://img.shields.io/bundlephobia/min/databasetify?style=flat-square) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/databasetify?style=flat-square) ![GitHub All Releases](https://img.shields.io/github/downloads/GianlucaTarantino/databasetify/total?style=flat-square)
- [Description](#managing-data-has-never-been-so-easy)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

## Managing data has never been so easy
With Databasetify, you can have a easier alternative to all those hard things like SQL. Transform a simple JSON file in a database-like document. Add, modify and analyze data with just the help of this cool thing called Javascript. Open a database directly in your code and use it with normal functions, without writing any query. It's very good for beginners and people that want to try something new and simple.
This is not, obviously, as powerful as an SQL database, but it is very lightweight (0 NPM dependencies!) and very simple!

## Features
- Very lightweight
- Easy install
- Simple usage
- As fast as JS-possible
- Totally open source (contribute!)

## Installation

You can use NPM to install Databasetify (if you want to manage your databasetify databases in a simpler way, install it globally)
```bash
# Install locally, for one project
npm install databasetify
# Install globally, system wide
npm install -g databasetify
```

## Usage
Databasetify is very simple. You can use it with simple JSONs and with Databasetify-valid JSONs. For more informations, check the [documentation](https://github.com/GianlucaTarantino/databasetify/blob/main/documentation.md).

```javascript
const databasetify = require("databasetify");
const db = new databasetify.Databasetify("path/to/db.json", 1)

db.addTable("Users", [{"name": "Name"}, {"name": "Surname"}]);
db.insert("Users", "0001", {"name": "John", "Surname": "Smith"})

// Thiw will return "Smith"
db.get("Users", "0001", "Surname");
// This will return the first value that has an h in the Surname field
db.find("Users", (value, key, column, counter) => {
    return (value.includes("h") && column == "Surname")
})
// Same as before, but will return an array with all the values and informations about the values
db.findAll("Users", (value, key, column, counter) => {
    return (value.includes("h") && column == "Surname")
})
```
Can I quickly add a table or modify something in a database, without having to execute that in a JS file? Well, yes! Simply open the Node terminal console and write what you would have written in the file!
```javascript
const databasetify = require("databasetify");
const db = new databasetify.Databasetify("path/to/db.json", 1)
db.addTable("Users", [{"name": "Name"}, {"name": "Surname"}]);
```


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change. There is already a template for pull requests and issues.

## Support
For any problem regarding Databasetify, you can always open an issue! If you want to contact me, feel free to write me at gianlutara@gmail.com

# License

[MIT](https://github.com/GianlucaTarantino/databasetify/blob/main/LICENSE)
