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
    const problemPath = pathfs.resolve(outputFiles, 'No Date')
    mkdirp.sync(outputFiles)
    const a = await Promise.map(files, async file=>{
        const path = pathfs.resolve(directory,file)
        if (fse.lstatSync(path).isDirectory()) return
        const data = await exif.read(path)
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
        const month = date.getUTCMonth() + 1 < 10 ? `0${date.getUTCMonth() + 1}` : date.getUTCMonth() + 1;
        const day = date.getUTCDate() < 10 ? `0${date.getUTCDate()}` : date.getUTCDate(); 
        const hours = date.getUTCHours() < 10 ? `0${date.getUTCHours()}` : date.getUTCHours(); 
        const minutes = date.getUTCMinutes() < 10 ? `0${date.getUTCMinutes()}` : date.getUTCMinutes(); 
        const seconds = date.getUTCSeconds() < 10 ? `0${date.getUTCSeconds()}` : date.getUTCSeconds();
        const newName = 
            date.getUTCFullYear() + "-" + 
            month + "-" + 
            day + "_" + 
            hours + ":" + 
            minutes+ ":" + 
            seconds + '_' +
            (Math.random() *1000).toFixed(0)
        if (fse.existsSync(pathfs.resolve(outputFiles, newName + pathfs.extname(file)))) {
            console.log(pathfs.resolve(outputFiles, newName + pathfs.extname(file)), "exist !: ", path);
        }
        return fse.copy(path, pathfs.resolve(outputFiles, newName + pathfs.extname(file)), {overwrite:false})
    },{concurrency:10})
})().catch(err=>console.log('err:', err))