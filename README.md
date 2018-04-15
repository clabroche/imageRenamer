[![Build Status](https://travis-ci.org/clabroche/imageRenamer.svg?branch=master)](https://travis-ci.org/clabroche/imageRenamer)
[![Coverage Status](./badge.svg)](https://clabroche.github.io/imageRenamer)

# Image Renamer 

Simple CLI Image renamer based on exif metadata

## Install
``` bash
git clone https://github.com/clabroche/imageRenamer.git
cd imageRenamer
npm i
```

## Usage

``` bash
node app <path to images directory>
```

By default:
<br><br> 
 - output directory => 'out< date taken on exif metadatas >.< extension >'
<br>![alt text](./readme/exif_before.png "With exif before") => ![alt text](./readme/exif_after.png "With exif after")

<br><br>
 - output no Exif => 'out/No Date/< initial filename >.< extension >' 
<br>![alt text](./readme/noexif_before.png "no exif before") => ![alt text](./readme/noexif_before.png "no exif after")

<br><br>
 - output no date taken metadata => 'out/< modifyDate >.< extension >'
<br>![alt text](./readme/modify_before.png "With exif no date taken before") => ![alt text](./readme/modify_after.png "With exif no date taken after")
