const path = require('path')
const ImgRenamer = require('./index')
const imgRenamer = new ImgRenamer({
    inputDirectory: path.resolve(process.argv[2]) || path.resolve('./')
}).launch().then(data=>{
    console.log(data)
}).catch(console.error);