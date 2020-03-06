const fetch = require('node-fetch').default

fetch('https://giftkade.com/api/products/all').then(res => console.log(res))