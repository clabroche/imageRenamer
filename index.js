const fse =require('fs-extra')
const Promise = require('bluebird')
const pathfs = require("path");
var exif = require("fast-exif");
var mkdirp = require("mkdirp");
const delimiter = '_';

(async _=>{
    const directory = pathfs.resolve(process.argv[2]);
    if (!fse.existsSync(directory)) throw new Error('path doesn\'t exist')
    const files = await fse.readdir(directory)
    const outputFiles = pathfs.resolve(directory, 'out')
    const problemPath = pathfs.resolve(outputFiles, 'problem')
    mkdirp.sync(outputFiles)
    const a = await Promise.map(files, file=>{
        const path = pathfs.resolve(directory,file)
        if (fse.lstatSync(path).isDirectory()) return
        return exif.read(path).then(data=>{
            let dateString            
            if (data !== null  && data.hasOwnProperty("exif") && data.exif && data.exif.hasOwnProperty('DateTimeOriginal')) {
                dateString = data.exif.DateTimeOriginal
            } else if (data !== null  && data.hasOwnProperty("image") && data.image && data.image.hasOwnProperty('ModifyDate')) {
                console.log("Take the modify date:",path)
                dateString = data.image.ModifyDate;
            } else {
                console.log('no exif', path)
                if (fse.existsSync(pathfs.resolve(problemPath, file))) {
                    console.log(pathfs.resolve(problemPath, file), "exist !");
                }
                return fse.copy(path, pathfs.resolve(problemPath, file), {overwrite:false})
            }
            const date = new Date(dateString)
            const newName = 
                date.getFullYear() + delimiter + 
                date.getMonth() + delimiter + 
                date.getDate() + delimiter + 
                date.getHours() + "" + 
                date.getMinutes() + "" + 
                date.getSeconds() + "" + 
                (Math.random() *1000).toFixed(0)
            if (fse.existsSync(pathfs.resolve(outputFiles, newName + pathfs.extname(file)))) {
              console.log(pathfs.resolve(outputFiles, newName + pathfs.extname(file)), "exist !: ", path);
            }
            return fse.copy(path, pathfs.resolve(outputFiles, newName + pathfs.extname(file)), {overwrite:false})
        }).catch(console.error);
    },{concurrency:10})
})().catch(err=>console.log('err:', err))