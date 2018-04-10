const ImgRenamer = require('../index')
const fse = require('fs-extra')
const pathfs = require('path')
const expect = require('chai').expect
const currentPath = pathfs.resolve('./')
describe('test', function(){
    it("should init with default value", function() {
      const imgRenamer = new ImgRenamer();
      expect(imgRenamer.hasOwnProperty("inputDirectory")).to.be.true;
      expect(imgRenamer.hasOwnProperty("outputDirectory")).to.be.true;
      expect(imgRenamer.hasOwnProperty("problemPath")).to.be.true;

      expect(imgRenamer.inputDirectory).equal(pathfs.resolve(currentPath));
      expect(imgRenamer.outputDirectory).equal(pathfs.resolve(currentPath, "out"));
      expect(imgRenamer.problemPath).equal(pathfs.resolve(currentPath, "out", "No Date"));
    })
    it("should init with different options", function() {
      const imgRenamer = new ImgRenamer({
        inputDirectory: pathfs.resolve(currentPath,"test", "img"),
        outputDirectory: pathfs.resolve(currentPath, "output"),
        problemPath: pathfs.resolve(currentPath, "problemPath")
      });
      expect(imgRenamer.hasOwnProperty("inputDirectory")).to.be.true;
      expect(imgRenamer.hasOwnProperty("outputDirectory")).to.be.true;
      expect(imgRenamer.hasOwnProperty("problemPath")).to.be.true;

      expect(imgRenamer.inputDirectory).equal(pathfs.resolve(currentPath, "test", "img"));
      expect(imgRenamer.outputDirectory).equal(pathfs.resolve(currentPath, "output"));
      expect(imgRenamer.problemPath).equal(pathfs.resolve(currentPath, "problemPath"));
    });
    it("should throw error when inputdirectory doesn't exist", function() {
        const badFn = function () {new ImgRenamer({inputDirectory: pathfs.resolve(currentPath, "test directory")})}
      expect(badFn).to.throw(Error);
    });

    it('should launch', function(done){
        const imgRenamer = new ImgRenamer({
          inputDirectory: pathfs.resolve(currentPath, "test", "img", "good"),
          outputDirectory:pathfs.resolve(currentPath, "out")
        }).launch().then(async _=>{
            const files = await fse.readdir(pathfs.resolve(currentPath, "out"))
            expect(files).contain("No Date");
            const badFiles = await fse.readdir(pathfs.resolve(currentPath, "out", "No Date"))
            await fse.remove(pathfs.resolve(currentPath, "out"));
            
            expect(files.length).equal(3)
            expect(files[0]).contain("2001-04-06_11:51:40_");
            expect(files[1]).contain("2018-04-11_00:36:09_");

            expect(badFiles.length).equal(1)
            expect(badFiles[0]).contain("image01713.jpg");
            done()
        }).catch(done);
    })
})