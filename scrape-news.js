/* Marie Laborde
 * Week 18 - Scrape News
 * ==================== */

// Deploy your application

// Commit your code to the repository and deploy it to Heroku using Git.

// $ git add .
// $ git commit -am "make it better"
// $ git push heroku master
// Existing Git repository

// For existing repositories, simply add the heroku remote

// $ heroku git:remote -a mongolab-week18


// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var exphbs = require("express-handlebars");
var logger = require("morgan");
var mongojs = require("mongojs");
var mongoose = require("mongoose");
var request = require("request");     // Snatches HTML from URLs
var cheerio = require("cheerio");     // Scrapes our HTML

// Initialize Express
var app = express();

// Configure our app for morgan and body parser
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

// Static file support with public folder
app.use(express.static("public"));

// Mongojs configuration
var databaseUrl = "scrapedNews";
var collections = ["taglines"];

// Hook our mongojs config to the db var
var db = mongojs(databaseUrl, collections);
db.on("error", function(error) {
  console.log("Database Error:", error);
});


// Routes
// ======

// Post a tagline to the mongoose database
app.post("/submit", function(req, res) {

  // Save the request body as an object called tagline
  var tagline = req.body;

  // If we want the object to have a boolean value of false,
  // we have to do it here, because the ajax post will convert it
  // to a string instead of a boolean
  tagline.read = false;

  // Save the tagline object as an entry into the taglines collection in mongo
  db.taglines.save(tagline, function(error, saved) {
    // Show any errors
    if (error) {
      console.log(error);
    }
    // Otherwise, send the response to the client (for AJAX success function)
    else {
      res.send(saved);
    }
  });
});


// Find all taglines marked as read
app.get("/read", function(req, res) {
  // Go into the mongo collection, and find all docs where "read" is true
  db.taglines.find({ "read": true }, function(error, found) {
    // Show any errors
    if (error) {
      console.log(error);
    }
    // Otherwise, send the taglines we found to the browser as a json
    else {
      console.log(found);
      res.json(found);
    }
  });
});


// Find all taglines marked as unread
app.get("/unread", function(req, res) {
  // Go into the mongo collection, and find all docs where "read" is false
  db.taglines.find({ "read": false }, function(error, found) {
    // Show any errors
    if (error) {
      console.log(error);
    }
    // Otherwise, send the taglines we found to the browser as a json
    else {
      res.json(found);
    }
  });
});


// Mark a tagline as having been read
app.get("/markread/:id", function(req, res) {
  // Remember: when searching by an id, the id needs to be passed in
  // as (mongojs.ObjectId(IDYOUWANTTOFIND))

  // Update a doc in the taglines collection with an ObjectId matching
  // the id parameter in the url
  db.taglines.update({
    "_id": mongojs.ObjectId(req.params.id)
  }, {
    // Set "read" to true for the tagline we specified
    $set: {
      "read": true
    }
  },
  // When that's done, run this function
  function(error, edited) {
    // show any errors
    if (error) {
      console.log(error);
      res.send(error);
    }
    // Otherwise, send the result of our update to the browser
    else {
      console.log(edited);
      res.send(edited);
    }
  });
});


// Mark a tagline as having been not read
app.get("/markunread/:id", function(req, res) {
  // Remember: when searching by an id, the id needs to be passed in
  // as (mongojs.ObjectId(IDYOUWANTTOFIND))

  // Update a doc in the books collection with an ObjectId matching
  // the id parameter in the url
  db.taglines.update({
    "_id": mongojs.ObjectId(req.params.id)
  }, {
    // Set "read" to false for the tagline we specified
    $set: {
      "read": false
    }
  },
  // When that's done, run this function
  function(error, edited) {
    // Show any errors
    if (error) {
      console.log(error);
      res.send(error);
    }
    // Otherwise, send the result of our update to the browser
    else {
      console.log(edited);
      res.send(edited);
    }
  });
});

// ----------------------------------
// First, tell the console what server.js is doing
console.log("\n***********************************\n" +
            "Grabbing every thread name and link\n" +
            "from reddit's webdev board:" +
            "\n***********************************\n");


// Making a request call for reddit's "webdev" board. The page's HTML is saved as the callback's third argument
request("https://www.reddit.com/r/webdev", function(error, response, html) {

  // Load the HTML into cheerio and save it to a variable
  // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
  var $ = cheerio.load(html);

  // An empty array to save the data that we'll scrape
  var result = [];

  // With cheerio, find each p-tag with the "title" class
  // (i: iterator. element: the current element)
  $("p.tagline").each(function(i, element) {

    // Save the text of the element (this) in a "title" variable
    var tagline = $(this).text();

    // In the currently selected element, look at its child elements (i.e., its a-tags),
    // then save the values for any "href" attributes that the child elements may have
    var link = $(element).find("a").attr("href");

    // Save these results in an object that we'll push into the result array we defined earlier
    result.push({
      tagline: tagline,
      link: link
    });

  });

  // Log the result once cheerio analyzes each of its selected elements
  console.log(result);
});
// ----------------------------------

// Run 'heroku config | grep MONGODB_URI'. When you’re ready to connect Mongoose with your remote database, simply paste the URI string as the lone argument of your mongoose.connect() function. 
mongoose.connect();

// Listen on port 3000
app.listen(3000, function() {
  console.log("App running on port 3000!");
});
