#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const es6promise = require('es6-promise');
const mkdirp = require('mkdirp');
const ytdl = require('ytdl-core');

es6promise.polyfill();

const WORKSHOPS = {
  './2016/10/': require('./2016/10/index')
};

function downloadVideo (sourceUrl, destinationFilename) {
  const stream = fs.createWriteStream(destinationFilename);
  const videoDownload = ytdl(sourceUrl).pipe(stream);

  return new Promise(function (resolve, reject) {
    stream.on('error', function (err) {
      reject(err);
    });
    stream.on('close', function () {
      resolve(destinationFilename);
    });
  });
}

Object.keys(WORKSHOPS).forEach(function (workshopDirectory) {
  var data = WORKSHOPS[workshopDirectory];
  var videos = [];

  const baseDir = path.join(__dirname, workshopDirectory, 'talks', 'videos');
  mkdirp.sync(baseDir);

  data.talks.forEach(function (talk) {
    if (!talk.video || !talk.video.youtube_url || !talk.video.filename) {
      return;
    }

    const sourceUrl = talk.video.youtube_url;
    const destinationFilename = path.join(baseDir, talk.video.filename);

    console.log('Downloading video:', sourceUrl);
    videos.push(downloadVideo(sourceUrl, destinationFilename));
  });

  Promise.all(videos).then(function () {
    console.log('Downloaded %d videos', videos.length);
  }).catch(function (err) {
    console.error('Could not generate videos:\n', err);
  });
});
