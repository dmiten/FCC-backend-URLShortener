"use strict"

let server = require("express"),
    mongo = require("mongodb"),
    fs = require("fs"),
    path = require("path"),

    shortener = require("./shortener"),

    app = server(),
    port = process.env.PORT || 8080,
    fileName = path.join(__dirname, "index.html");

require('dotenv').config({
  silent: true
});

mongo.MongoClient.connect(process.env.MONGOLAB_URI ||
    "mongodb://localhost:27017/url-shortener", (error, db) => {

  if (error) {
    throw new Error("Database failed to connect!");
  } else {
    console.log("Successfully connected to MongoDB on port 27017.")
  };

  db.createCollection("sites", {
    capped: true,
    size: 5242880,
    max: 5000
  });

  app.listen(port, () => {
    console.log("Listening on port: " + port)
  });

  app.get("/", (req, res) => {
    res.sendFile(fileName, err => {
      if (err) {
        console.log(err);
        res.status(err.status).end()
      } else {
        console.log("Sent:", fileName)
      }
    })
  });

  app.use("/", (req, res) => {
    shortener(req, res, db)
  })

});