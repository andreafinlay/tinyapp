const PORT = process.env.PORT || 8080;
const express = require("express");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const app = express();
app.set("view engine", "ejs");

app.use(cookieSession({
  name: 'session',
  keys: ['fd0c4ab8d5c']
}));

app.use(bodyParser.urlencoded({extended: true}));

function generateRandomString() {
return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
};

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", createdBy: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", createdBy: "user2RandomID" },
  '29e36d': { longURL: ' http://4.org', createdBy: "userRandomID" }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "asdf"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "asdf"
  }
};

function findUser(email) {
 for (let userID in users) {
   if (email === users[userID].email) {
     return users[userID];
   }
 }
 return false;
};

function urlsForUser(id) {
  let privateURLs = {};
  let arrayOfShortURLs = Object.keys(urlDatabase);
  for (let shortURL of arrayOfShortURLs) {
    let creator = urlDatabase[shortURL].createdBy;
    let longURL = urlDatabase[shortURL].longURL;
    if (id === creator) {
      privateURLs[shortURL] = longURL;
    }
  }
  return privateURLs;
};

app.get("/", (req, res) => {
  res.end("homepage");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const formEmail = req.body.email;
  const formPass = req.body.password;
  let userFound = false;
  if (formEmail === "" && formPass === "") {
    res.status(400).send("please enter an email address and password to continue");
  } else if (formEmail === "") {
    res.status(400).send("please enter an email address in the format 'example@email.com'");
  } else if (formPass === "") {
    res.status(400).send("please enter a password containing at least 1 character");
  } else {
    findUser(formEmail);
    } if (userFound) {
      res.status(400).send("that email is already registered. please enter a new email address");
    } else {
        users[id] = { id: id, email: formEmail, password: bcrypt.hashSync(formPass, 10) };
        req.session.user_id = users[id].id;
        res.redirect("/urls");
    }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const formEmail = req.body.email;
  const formPass = req.body.password;
  let userFound = findUser(formEmail);
  let passwordCorrect = bcrypt.compareSync(formPass, userFound.password);
  if (passwordCorrect = true && userFound) {
    req.session.user_id = userFound.id;
    res.redirect("/");
  } else {
    res.status(403).send("incorrect credentials. please try again.")
  }
});

app.get("/urls", (req, res) => {
  let userID = req.session.user_id;
  let templateVars = { user: userID };
  if (userID === undefined) {
    res.status(403).send("you are not logged in. please log in to continue");
  } else {
    let privateURLs = urlsForUser(req.session.user_id);
    templateVars.privateURLs = privateURLs;
  }
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let anyUser = req.session.user_id;
  if (!anyUser) {
    res.redirect("/login");
  } else {
    res.render("urls_new");
  }
});

app.get("/urls/new", (req, res) => {
  let userID = req.session.user_id;
  let templateVars = { user: users[userID] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let userID =  req.session.user_id;
  var shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: longURL, createdBy: userID };
  res.redirect("/urls/" + shortURL);
});

app.get("/u/:shortURL", (req, res) => {
  let arrayOfShortURLs = Object.keys(urlDatabase);
  let shortURL = req.params.shortURL;
  for (let match of arrayOfShortURLs) {
    if (shortURL === match) {
    let longURL = urlDatabase[shortURL].longURL;
    return res.redirect(longURL);
    }
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let userID = req.session.user_id;
  let templateVars = { user: users[userID], shortURL: req.params.id, longURL: urlDatabase[shortURL] };
  if (userID === undefined) {
    res.status(403).send("you are not logged in. please log in to continue");
  } else if (userID !== urlDatabase[shortURL].createdBy) {
    res.status(403).send("you did not create this link. you do not have permission to edit it");
  }
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  let currentUser = req.session.user_id;
  let authorizedUser = urlDatabase[shortURL].createdBy;
  if (currentUser !== authorizedUser) {
    res.status(403).send("you do not have permission to modify this url. please log into your own session to edit links.")
  } else {
    urlDatabase[shortURL].longURL = req.body.longURL;
    res.redirect("/urls");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  let shortURL = req.params.id;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
