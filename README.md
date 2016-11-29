# WebVR Events

**[Archives of WebVR events.](https://events.webvr.rocks/)**


## Archives

* **[W3C Workshops](w3c-workshops/)**
    * [October 19-20, 2016 (San Jose, California)](w3c-workshops/2016/10/)


## Developer notes

The metadata for the Workshop talks are in the [`2016/10/index.json`](2016/10/index.json) file.

There are keys called `video` which contain a YouTube URL and a destination filename. To download the videos to the respective `videos/` directory:

```sh
npm run sync:videos
```

In the respective `email-templates/` directory, there are files for the subject line (`subject.njk`) and email body template (`text.njk`). To generate the emails for the recipients:

```sh
npm run sync:emails
```

To start a simple local web server for development:

```sh
npm start
```

Then load **[`https://localhost:8080`](https://localhost:8080)** to view the files. To view the videos, for example, load [`https://localhost:8080/2016/10/talks/videos/`](https://localhost:8080/2016/10/talks/videos/).

To deploy to the **[production server](https://w3c-webvr.surge.sh/)**:

```sh
npm run deploy
```

## License

[MIT](LICENSE.md)
