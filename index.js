const fse = require("fs-extra");
const Promise = require("bluebird");
const pathfs = require("path");
var exif = require("fast-exif");
var mkdirp = require("mkdirp");
const inquirer = require('inquirer');
const { basename, dirname } = require("path");
const delimiter = "_";

function imageRenamer(config = {}) {
  this.inputDirectory = config.inputDirectory ? pathfs.resolve(config.inputDirectory) : pathfs.resolve("./");
  this.outputDirectory = config.outputDirectory ? pathfs.resolve(config.outputDirectory) : pathfs.resolve(this.inputDirectory, "out");
  this.problemPath = config.problemPath ? pathfs.resolve(config.problemPath) : pathfs.resolve(this.outputDirectory, "No Date");
  if (!fse.existsSync(this.inputDirectory)) throw new Error("Path doesn't exist");
}

imageRenamer.prototype.launch = async function() {
  const directory = this.inputDirectory;
  const outputFiles = this.outputDirectory
  mkdirp.sync(outputFiles);
  const files = await fse.readdir(directory);
  const filesInfos = await Promise.map(files, file => this.analyzeFile(pathfs.resolve(directory, file)),{ concurrency: 10 })
  await this.menu(filesInfos)
};

imageRenamer.prototype.menu = async function(filesInfos) {
  console.log('All files has been analyzed')
  const {fun} = await inquirer.prompt({ name: 'Choisissez', message:'', type: 'list', name: 'fun',choices: [
    { type: 'choice', value: this.copyAll, name: 'Rename all files' },
    { type: 'choice', value: this.copyAllAndDaysSplit, name: 'Rename all files and place it in days folder' },
  ]})
  return fun(filesInfos)
}

imageRenamer.prototype.copyAll = function (filesInfos) {
  return Promise.map(filesInfos, copyFile, { concurrency: 10 });
}

imageRenamer.prototype.copyAllAndDaysSplit = function (filesInfos) {
  return Promise.map(filesInfos, (file) => copyFile(file, {inDaysFolder: true}), { concurrency: 10 });
}

imageRenamer.prototype.analyzeFile = async function(path) {
  const filename = pathfs.basename(path)
  const problemPath = pathfs.resolve(this.problemPath, filename)
  const res = {
    path,
    newPath: '',
    dates: {
      date: null, year: null, month: null, day: null, hours: null, minutes: null, seconds:null
    }
  }
  if (fse.lstatSync(path).isDirectory()) return res;
  // Try to guess  dates from file
  const data = await readExif(path)
  const hasDateTimeOriginal = () => data !== null && data.hasOwnProperty("exif") && data.exif && data.exif.hasOwnProperty("DateTimeOriginal")
  const hasModifiedDate = () => data !== null && data.hasOwnProperty("image") && data.image && data.image.hasOwnProperty("ModifyDate")
  if (hasDateTimeOriginal()) {
    res.dates = getDates(data.exif.DateTimeOriginal)
  } else if (hasModifiedDate()) {
    res.dates = getDates(data.image.ModifyDate)
  }
  // Build new path with dates if available
  if(res.dates.date) res.newPath = pathfs.resolve(this.outputDirectory, guessfilename(res.dates) + pathfs.extname(path));
  else res.newPath = problemPath
  return res
}
function getDates(dateString) {
  const date = new Date(dateString);
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1 < 10 ? `0${date.getUTCMonth() + 1}` : date.getUTCMonth() + 1;
  const day = date.getUTCDate() < 10 ? `0${date.getUTCDate()}` : date.getUTCDate();
  const hours = date.getUTCHours() < 10 ? `0${date.getUTCHours()}` : date.getUTCHours();
  const minutes = date.getUTCMinutes() < 10 ? `0${date.getUTCMinutes()}` : date.getUTCMinutes();
  const seconds = date.getUTCSeconds() < 10 ? `0${date.getUTCSeconds()}` : date.getUTCSeconds();
  return {
    date, year, month, day, hours,minutes,seconds
  }
}
function guessfilename({year, month, day, hours, minutes, seconds}) {
  return year + "-" + month + "-" + day + "_" + hours + "-" + minutes + "-" + seconds + "_" + (Math.random() * 1000).toFixed(0);
}

function copyFile(file, options = {}) {
  let newPath = file.newPath
  if (options.inDaysFolder && !newPath.includes('No Date') && file.dates.date) {
    const { year, month, day } = file.dates
    const folder = `${year}-${month}-${day}`
    const dirPath = pathfs.resolve(dirname(newPath), folder)
    if(!fse.existsSync(dirPath)) {
      fse.mkdirpSync(dirPath)
    }
    newPath = pathfs.resolve(dirPath, basename(newPath))
  }

  const path = file.path
  const exist = fse.existsSync(newPath)
  if (newPath && !exist) {
    return fse.copy(path, newPath, { overwrite: false });
  } else if (exist) {
    console.log(newPath, 'exist !')
  }
}

function readExif(path) {
  return exif.read(path).catch((err) => null)
}

module.exports = imageRenamer