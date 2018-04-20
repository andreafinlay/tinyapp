var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;
app.set("view engine", "ejs");

var cookieParser = require('cookie-parser');
app.use(cookieParser());

const bodyParser = require("body-parser");
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
}

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

// console.log("function outside endpoint: ", urlsForUser('userRandomID'));

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
    for (let userID in users) {
      if (formEmail === users[userID].email) {
        userFound = true;
        }
    } if (userFound === true) {
      res.status(400).send("that email is already registered. please enter a new email address");
    } else {
        users[id] = { id: id, email: formEmail, password: formPass };
        res.cookie("user_id", users[id].id);
        res.redirect("/urls");
        }
    }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const formEmail = req.body.email;
  const formPass = req.body.password;
  let userFound = findUser(formEmail);

  if (userFound && userFound.password === formPass) {
    res.cookie("user_id", userFound.id);
    res.redirect("/");
  } else {
    res.status(403).send("incorrect credentials. please try again.")
  }
});

app.get("/urls", (req, res) => {
  let userID = req.cookies["user_id"];
  let templateVars = { user: userID };
  if (userID === undefined) {
    res.status(403).send("you are not logged in. please log in to continue");
  } else {
    let privateURLs = urlsForUser(req.cookies["user_id"]);
    templateVars.privateURLs = privateURLs;
  }
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let anyUser = req.cookies.user_id;
  if (!anyUser) {
    res.redirect("/login");
  } else {
    res.render("urls_new");
  }
});

app.get("/urls/new", (req, res) => {
  let userID = req.cookies["user_id"];
  let templateVars = { user: users[userID] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let userID =  req.cookies.user_id;
  var shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: longURL, createdBy: userID };
  // console.log("urlDatabase: ", urlDatabase);
  res.redirect("/urls/" + shortURL);
});

app.get("/u/:shortURL", (req, res) => {
  let arrayOfShortURLs = Object.keys(urlDatabase);
  for (let shortURL of arrayOfShortURLs) {
    let longURL = urlDatabase[shortURL].longURL;
    return res.redirect(longURL);
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let userID = req.cookies["user_id"];
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
  let currentUser = req.cookies["user_id"];
  let authorizedUser = urlDatabase[shortURL].userID
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
