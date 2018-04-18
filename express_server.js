var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

function generateRandomString() {
return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
}

// database
var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// home page
app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls", (req, res) => {
  // export an object w key "urls", equated to the database.
  // exporting makes the key-value pairs available to use
  // in the destination ejs file (urls_index)
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  // render form page with blank form
  res.render("urls_new");
});

// re-render form page and run the function
app.post("/urls/new", (req, res) => {
  // generate shorturl and equate to randomString
  var randomString = generateRandomString();
  // add shorturl to urlDatabase
  urlDatabase[randomString] = req.body["longURL"];
  // redirect to page with custom url (urls_show)
  res.redirect("/urls/" + randomString);
});

// redirects to (using :shortURL as a placeholder
// for the shortened URL)
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// :id is a placeholder for the shortened URL
// (urls_show)
app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const templateVars = { shortURL: req.params.id };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
