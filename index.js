const fse = require("fs-extra");
const Promise = require("bluebird");
const pathfs = require("path");
var exif = require("fast-exif");
var mkdirp = require("mkdirp");
const {prompt} = require('inquirer')
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
  await Promise
    .map(files, file => this.analyzeFile(pathfs.resolve(directory, file)),{ concurrency: 10 })
    .map(copy, {concurrency: 10});
};

imageRenamer.prototype.analyzeFile = async function(path) {
  const filename = pathfs.basename(path)
  const problemPath = pathfs.resolve(this.problemPath, filename)
  const res = {
    path,
    newPath: '',
  }
  if (fse.lstatSync(path).isDirectory()) return res;

  const data = await readExif(path)
  const hasDateTimeOriginal = () => data !== null && data.hasOwnProperty("exif") && data.exif && data.exif.hasOwnProperty("DateTimeOriginal")
  const hasModifiedDate = () => data !== null && data.hasOwnProperty("image") && data.image && data.image.hasOwnProperty("ModifyDate")
  if (hasDateTimeOriginal()) res.newPath = pathfs.resolve(this.outputDirectory, guessfilename(data.exif.DateTimeOriginal) + pathfs.extname(path));
  else if (hasModifiedDate()) res.newPath = pathfs.resolve(this.outputDirectory, guessfilename(data.image.ModifyDate) + pathfs.extname(path));
  else res.newPath = problemPath
  return res
}
function guessfilename(dateString) {
  const date = new Date(dateString);
  const month = date.getUTCMonth() + 1 < 10 ? `0${date.getUTCMonth() + 1}` : date.getUTCMonth() + 1;
  const day = date.getUTCDate() < 10 ? `0${date.getUTCDate()}` : date.getUTCDate();
  const hours = date.getUTCHours() < 10 ? `0${date.getUTCHours()}` : date.getUTCHours();
  const minutes = date.getUTCMinutes() < 10 ? `0${date.getUTCMinutes()}` : date.getUTCMinutes();
  const seconds = date.getUTCSeconds() < 10 ? `0${date.getUTCSeconds()}` : date.getUTCSeconds();
  const newName = date.getUTCFullYear() + "-" + month + "-" + day + "_" + hours + "-" + minutes + "-" + seconds + "_" + (Math.random() * 1000).toFixed(0);
  return newName
}

function copy(file) {
  const newPath = file.newPath
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