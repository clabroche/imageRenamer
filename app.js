const path = require('path')
const ImgRenamer = require('./index')
const imgRenamer = new ImgRenamer({
    inputDirectory: path.resolve(process.argv[2]) || path.resolve('./')
}).launch().catch(console.error);