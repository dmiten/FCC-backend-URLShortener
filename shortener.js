"use strict"

module.exports = function shortener(req, res, db) {

  let short_url,
      response = {},
      url = req.url.slice(1),
      sites = db.collection("sites"),

      // from https://gist.github.com/vaiorabbit/5657561
      hashFnv32a = (str) => {
        let i, l, hval;
        for (i = 0, l = str.length; i < l; i++) {
          hval ^= str.charCodeAt(i);
          hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24)
        };
        return hval >>> 0
      },

      validateURL = (url) => {
        // regex from https://gist.github.com/dperini/729294
        let regex = new RegExp(
            "^(?:(?:https?|ftp)://)(?:\\S+(?::\\S*)?@)?(?:" +
            "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
            "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
            "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
            "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
            "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
            "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|" +
            "(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)" +
            "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*" +
            "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))\\.?)(?::\\d{2,5})?" +
            "(?:[/?#]\\S*)?$", "i");
        return regex.test(url)
      };

  // url is numb, may be it's on db
  if (+url) {
    sites.findOne({ "short_url": +url }, (err, result) => {
      if (err) throw err;
      if (result) {
        console.log("Found, redirecting to: " + result.original_url);
        res.redirect(result.original_url)
      } else {
        res.send({ "error": "This url is't on the database." })
      }
    })

  // is url valid and doesn't absent? => keep it
  } else {
    if (validateURL(url)) {
      sites.findOne({ "original_url": url }, (err, result) => {
        if (err) throw err;
        if (result) {
          response = {
            "original_url": result.original_url,
            "short_url": process.env.APP_URL + result.short_url
          };
          console.log("URL in db already.");
          res.send(response)
        } else {
          short_url = hashFnv32a(url);
          response = {
            "original_url": url,
            "short_url": short_url
          };
          sites.save(response, (err, result) => {
            if (err) throw err;
            console.log("Saved :", response);
            response.short_url = process.env.APP_URL + short_url;
            delete response._id;
            res.send(response)
          })
        }
      })
    } else {
      res.send({ "error": "Wrong url format." })
    }
  }

};