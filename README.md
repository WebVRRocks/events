# W3C Web & Virtual Reality Workshop

The primary goal of the first W3C Web & Virtual Reality Workshop workshop was to bring together practitioners of Web and Virtual Reality technologies to make the Open Web Platform a better delivery mechanism for VR experiences.

The secondary goals of the workshop were as follows:

* Share experiences between practitioners in VR and related fields.
* Discuss how to solve for VR use cases that are difficult or impossible today on the Web.
* Identify potential future standards and establish timelines to enable the Web to be a successful VR platform


## October 19-20, 2016 (San Jose, California)

* Videos

* See the **[workshop report](https://www.w3.org/2016/06/vr-workshop/report.html)** and **[minutes](https://www.w3.org/2016/06/vr-workshop/minutes.html)** of the Workshop.
* See the **[agenda](https://www.w3.org/2016/06/vr-workshop/schedule.html)** for the slides of the talks presented during the Workshop.
* See the **[position statements](https://www.w3.org/2016/06/vr-workshop/papers.html)** submitted as input to the Workshop.


## Developer notes

To download locally the YouTube videos specified

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


## License

[MIT](LICENSE.md)
