#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

require('es6-promise').polyfill();

const deepAssign = require('deep-assign');
const EmailTemplate = require('email-templates').EmailTemplate;
const mkdirp = require('mkdirp');
const nunjucks = require('nunjucks');
var pkg = {
  sync: {
    production: {
      base_url: ''
    }
  }
};

try {
  let pkgCurrent = require(process.cwd() + path.sep + 'package');
  pkg = deepAssign({}, pkg, pkgCurrent);
} catch (e) {
  console.warn(e);
}

const IS_PROD = process.env.NODE_ENVIRONMENT === 'production';
const BASE_URL_WORKSHOPS = pkg.sync.production.base_url || '';
const WORKSHOPS = {
  'w3c-workshops/2016/10/': require('./2016/10/index')
};

function renderEmail (template, ctx) {
  return new Promise(function (resolve, reject) {
    template.render(ctx, function (err, result) {
      if (err) {
        reject(err);
        return;
      }

      resolve({
        email: result,
        context: ctx
      });
    });
  });
}

function writeFile (destinationFilename, body, source) {
  return new Promise(function (resolve, reject) {
    var file = fs.writeFile(destinationFilename, body, function (err) {
      if (err) {
        reject(err);
        return;
      }

      var destinationFilenameUrl = destinationFilename;

      var posOfDirnameInPath = destinationFilename.indexOf(__dirname);
      if (posOfDirnameInPath === 0) {
        destinationFilenameUrl = BASE_URL_WORKSHOPS + destinationFilename.substr(__dirname.length + 1);
      }

      resolve({
        filename: destinationFilename,
        filenameUrl: destinationFilenameUrl,
        body: body,
        source: source
      });
    });
  });
}

function attachAuthorNameMetadata (author) {
  const name = author.name;
  const nameFirstSpacePos = name.indexOf(' ');
  author._first_name = author.first_name || name.substr(0, nameFirstSpacePos);
  author._last_name = author.last_name || name.substr(nameFirstSpacePos + 1);
  author._name = name || author.first_name;
  return author;
}

function isValidFilename (filename) {
  if (filename.indexOf(path.sep) === -1) {
    return false;
  }
  var baseDir = path.basename(filename);
  var baseDirInfo = fs.statSync(baseDir);
  return !baseDirInfo.isDirectory() &&
         !baseDirInfo.isSymbolicLink();
}

function sortBy (list, key) {
  return list.sort(function (a, b) {
    var nameA = a[key].toLowerCase();
    var nameB = b[key].toLowerCase();
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    return 0;
  });
}

Object.keys(WORKSHOPS).forEach(function (workshopDirName) {
  var data = WORKSHOPS[workshopDirName];
  var people = {};
  var talksByRecipients = {};

  const workshopDir = path.join(process.cwd(), workshopDirName);

  const emailOutputDir = path.join(workshopDir, 'talks', 'emails');
  const emailTemplateDir = path.join(workshopDir, 'talks', 'emails-templates');

  const emailTemplate = new EmailTemplate(emailTemplateDir);
  const emailsBaseUrl = BASE_URL_WORKSHOPS + workshopDirName + 'talks/emails/';
  const videosBaseUrl = BASE_URL_WORKSHOPS + workshopDirName + 'talks/videos/';

  mkdirp.sync(emailOutputDir);

  if (!data.people) {
    return;
  }

  data.people.forEach(function (author) {
    if (!author || !author.slug) {
      return;
    }

    people[author.slug] = author;
  });

  data.talks.forEach(function (talk) {
    talk.authors.forEach(function (authorSlug) {
      var author = people[authorSlug];
      if (!author) {
        return;
      }

      if (talk.video && talk.video.youtube_url && talk.video.filename) {
        talk.video.raw_url = videosBaseUrl + talk.video.filename;
      } else {
        if (!talk.video) {
          talk.video = {};
        }
        talk.video.youtube_url = talk.video.raw_url = '(video was unfortunately able to be captured)';
      }

      author = attachAuthorNameMetadata(author);

      if ('_recipients' in talk) {
        if (talk._recipients.indexOf(author) === -1) {
          talk._recipients.push(author);
        }
      } else {
        talk._recipients = [author];
      }
      if (authorSlug in talksByRecipients) {
        talksByRecipients[authorSlug].push(talk);
      } else {
        talksByRecipients[authorSlug] = [talk];
      }
    });
  });

  var emailTemplates = Object.keys(talksByRecipients).map(function (authorSlug) {
    const talks = talksByRecipients[authorSlug];
    const recipient = people[authorSlug];
    if (!talks || !talks.length || !recipient) {
      return;
    }

    if (!recipient.first_name && !recipient.name) {
      console.warn('Could not find name for recipient with slug "%s"', authorSlug);
      return;
    }

    if (!recipient.email) {
      console.warn('Could not find email address for recipient with name "%s" (slug "%s")', recipientName, authorSlug);
      return;
    }

    sortBy(talks, 'title');

    let filename = filenameBase = recipient.email + '.txt';
    if (!isValidFilename(filename)) {
      filename = path.join(emailOutputDir, filename);
    }

    const ctx = {
      filename: filename,
      filenameBase: filenameBase,
      recipient: recipient,
      talks: talks
    };

    return renderEmail(emailTemplate, ctx);
  });

  return Promise.all(emailTemplates).then(function (emails) {
    console.log('Generated %d email templates to render', emails.length);

    var emailFiles = emails.map(function (item) {
      var email = item.email;
      var ctx = item.context;

      var emailFilename = ctx.filename;
      var emailFilenameBase = ctx.filenameBase;

      var emailText = email.text;
      var emailHtml = email.html;

      var emailBody = emailText;

      if (emailHtml) {
        emailFilename = emailFilename.replace(/(.txt)?$/, '.html');
        emailBody = email.html;
      }

      if (!('filenameUrl' in ctx)) {
        ctx.filenameUrl = emailsBaseUrl + emailFilenameBase;
      }

      return writeFile(emailFilename, emailBody, {
        email: email,
        context: ctx
      });
    });

    Promise.all(emailFiles).then(function (files) {
      var headerLine = '';
      if (files.length) {
        headerLine = [
          'Recipient',
          'Name',
          'Email',
          'Subject',
          'File'
        ].join(', ');
      }
      var filenames = [];
      var lines = files.map(function (file) {
        var email = file.source.email;
        var ctx = file.source.context;
        filenames.push(file.filename);
        return [
          `${ctx.recipient.name} <${ctx.recipient.email}>`,
          ctx.recipient.name,
          ctx.recipient.email,
          email.subject.trim(),
          IS_PROD ? ctx.filenameUrl : ctx.filename
        ].join(', ');
      });

      console.log('\nGenerated %d email messages to send', filenames.length);
      console.log(filenames.join('\n'));

      var csvFilename = path.join(emailOutputDir, 'index.csv');
      var csvBody = [headerLine].concat(lines).join('\n');
      return writeFile(csvFilename, csvBody, {
        files: files
      });
    }).then(function (csvFile) {
      console.log('\nGenerated CSV file for data for emails to send');
      console.log(csvFile.filename);
      console.log(csvFile.filenameUrl);
      console.log();
      console.log(csvFile.body);
    }, function (err) {
      console.error('\nCould not generate CSV file:\n', err);
    }).catch(function (err) {
      console.error('\nUnknown error:\n', err);
    });
  }).catch(function (err) {
    console.error('\nCould not generate email templates:\n', err);
  });
});
