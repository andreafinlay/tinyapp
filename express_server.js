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

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    createdBy: "f5edc3"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    createdBy: "8541a7"
  }
};

const users = {
  "f5edc3": {
    id: "f5edc3",
    email: "user@example.com",
    password: '$2a$10$rdMtU6O7ZRsYh4HGnyODEuNezHmWjQ.zLUz3OuowkzPX5dH0AK55y'
  },
  "8541a7": {
    id: "8541a7",
    email: "user2@example.com",
    password: '$2a$10$2EvIDz42bW0qa4qNzAjhIeubCz0gcL8XPxX3nVhzSoyodpepzeSuW'
  }
};

function generateRandomString() {
return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
};


// Retrieves user from database, returns user or false
function findUser(email) {
 for (let userID in users) {
   if (email === users[userID].email) {
     return users[userID];
   }
 }
 return false;
};

// Retrieves URL from database, returns URL or false
function findURLInDatabase(shortURL) {
  const arrayOfShortURLs = Object.keys(urlDatabase);
  for (let i = 0; i < arrayOfShortURLs.length; i++) {
    if (shortURL === arrayOfShortURLs[i]) {
      return arrayOfShortURLs[i];
    }
  }
  return false;
};

// Retrieves short URLs associated with a given user
function urlsForUser(id) {
  const privateURLs = {};
  const arrayOfShortURLs = Object.keys(urlDatabase);
  for (let shortURL of arrayOfShortURLs) {
    const creator = urlDatabase[shortURL].createdBy;
    const longURL = urlDatabase[shortURL].longURL;
    if (id === creator) {
      privateURLs[shortURL] = longURL;
    }
  }
  return privateURLs;
};

/*-----------------------------------------*/
/////////////////
//  Home Page  //
/////////////////
/*-----------------------------------------*/

// Renders landing page or
// redirects to database if user is already logged in
app.get("/", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
  res.render("landing");
  } else {
  res.redirect("/urls");
 }
});

/*-----------------------------------------*/
////////////////////////////
//  Login & Registration  //
////////////////////////////
/*-----------------------------------------*/

// Renders login page or
// redirects to database if user is already logged in
app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  if (userID)  {
    res.redirect("/urls");
  } else {
    res.render("login");
  }
});

// Renders registration page or
// redirects to database if user is already registered
app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  if (userID)  {
    res.redirect("/urls");
  } else {
    res.render("register");
  }
});

// Verifies that user exists, checks hashed password,
// if request is valid, logs user in and sets an encrypoted cookie,
// redirects to database
app.post("/login", (req, res) => {
  const formEmail = req.body.email;
  const formPass = req.body.password;
  let userFound = findUser(formEmail);
  if (!userFound) {
    res.status(403).send("TinyApp: Incorrect credentials. Please try again by using the back arrow.")
  } else {
    let passwordCorrect = bcrypt.compareSync(formPass, userFound.password);
    if (passwordCorrect) {
      req.session.user_id = userFound.id;
      res.redirect("/urls");
    } else {
      res.status(403).send("TinyApp: Incorrect credentials. Please try again by using the back arrow.")
     }
  }
});

// Verifies that user does not already exist, validates credentials,
// if request is valid, logs user in and sets an encrypoted cookie
// redirects to database
app.post("/register", (req, res) => {
  const id = generateRandomString();
  const formEmail = req.body.email;
  const formPass = req.body.password;
  let userFound = findUser(formEmail);
    if (userFound) {
    res.status(400).send("TinyApp: That email address is already registered. Please try again with a new email address.");
  } else if (formEmail === "" && formPass === "") {
    res.status(400).send("TinyApp: Please enter an email address and password to continue.");
  } else if (formEmail === "") {
    res.status(400).send("TinyApp: Please enter an email address in the format 'example@email.com'.");
  } else if (formPass === "") {
    res.status(400).send("TinyApp: Please enter a password containing at least 1 character.");
  } else {
        users[id] = {
          id: id,
          email: formEmail,
          password: bcrypt.hashSync(formPass, 10)
        };
      req.session.user_id = users[id].id;
      res.redirect("/urls");
    }
});

/*-----------------------------------------*/
/////////////////////
//  User Controls  //
/////////////////////
/*-----------------------------------------*/

// Displays url database for an existing user, or
// redirects to landing page
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  if (userID === undefined) {
    res.redirect("/");
  } else {
    const templateVars = {
      users: users,
      user: users[userID].id,
      email: users[userID].email
    };
    const privateURLs = urlsForUser(req.session.user_id);
    templateVars.privateURLs = privateURLs;
    res.render("urls_index", templateVars);
  }
});

// Generates a random string which is used as the short URL,
// redirects to update page
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const userID =  req.session.user_id;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: longURL,
    createdBy: userID
  };
  res.redirect("/urls/" + shortURL);
});

// Displays the short URL creation page for a specific user or
// redirects to the landing page
app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
  const templateVars = {
    users: users,
    user: users[userID].id,
    email: users[userID].email
  };
  res.render("urls_new", templateVars);
  } else {
  res.redirect("/");
}
});

// Displays the short URL creation page or
// redirects to landing page
app.get("/urls/new", (req, res) => {
  const anyUser = req.session.user_id;
  if (!anyUser) {
    res.redirect("/");
  } else {
    res.render("urls_new");
  }
});

// Redirects the user from the short URL to the original URL or
// returns 404 if the URL is not found
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const URLFound = findURLInDatabase(shortURL);
    if (URLFound === false) {
    res.status(404).send("TinyApp: There is no URL associated with this link. Please try again with a valid short URL.")
  } else {
    let longURL = urlDatabase[shortURL].longURL;
    return res.redirect(longURL);
    }
});

// If a user is logged in and has permission to edit links,
// render URL update page or else
// redirect to landing page
app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const userID = req.session.user_id;
  const URLFound = findURLInDatabase(shortURL);
  if (URLFound === false) {
    res.status(404).send("TinyApp: There is no URL associated with this link. Please try again with a valid short URL.")
  } else if (userID === undefined) {
    res.redirect("/");
  } else if (userID !== urlDatabase[shortURL].createdBy) {
    res.status(403).send("TinyApp: You did not create this link. You do not have permission to modify it.");
  } const templateVars = {
    users: users,
    user: users[userID].id,
    email: users[userID].email,
    shortURL: req.params.id,
    longURL: urlDatabase[shortURL]
  };
  res.render("urls_show", templateVars);
});

// If the user has permission, updates the short URL and
// redirects to database
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  let currentUser = req.session.user_id;
  let authorizedUser = urlDatabase[shortURL].createdBy;
  if (currentUser !== authorizedUser) {
    res.status(403).send("TinyApp: You do not have permission to modify this URL. Please log into your own session to modify links.")
  } else {
    urlDatabase[shortURL].longURL = req.body.longURL;
    res.redirect("/urls");
  }
});

// Deletes an existing short URL in the database
app.post("/urls/:id/delete", (req, res) => {
  let shortURL = req.params.id;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// Logs the current user out, clears cookies, and
// redirects to home page (& landing page)
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}...`);
});
