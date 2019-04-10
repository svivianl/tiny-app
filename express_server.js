// git push -u origin master
/***************************************************************************
  Variables
***************************************************************************/
const bodyParser  = require("body-parser");
var express       = require("express");
var cookieParser  = require('cookie-parser');
const session     = require('express-session');
const flash       = require("connect-flash"); // messages

var app     = express();
var PORT    = 8080;

/***************************************************************************
  Data
***************************************************************************/
// urlDatabase keys:
//    longURL
//    userID
let urlDatabase = {};

// users keys:
//    id
//    email
//    password
let users = {};

/***************************************************************************
  Initialization
***************************************************************************/
app.set("view engine", "ejs");
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
// app.use(flash());
// app.use(session({
//   cookie: { maxAge: 60000 },
//   secret: 'flashMessages',
//   resave: false,
//   saveUninitialized: false
// }));
// console.log('config');

// app.use(function(req, res, next){
//   res.locals.error = 'test';
//   // res.locals.success = req.flash('success');
//   // res.locals.error = req.flash('error');
// });

/***************************************************************************
  Functions
***************************************************************************/
function generateRandomString() {
  return Math.random().toString(36).substring(7);
}

// gets user by e-mail
const getUser = email => {
  let found = undefined;
  for(user in users){
    if(users[user].email === email){
      found = users[user];
      break;
    }
  }
  return found;
}

// check if e-mail already exists
const userExists = email => {
  let found = false;
  for(user in users){
    if(users[user].email === email){
      found = true;
      break;
    }
  }
  return found;
}

// gets the user's URLs
const urlsForUser = userID => {
  let found = {};
  // console.log('urlDatabase ', urlDatabase);
  for(key in urlDatabase){
    // console.log(`key: ${key}
    //   urlDatabase[key].userID: ${urlDatabase[key].userID}
    //   userID: ${userID}`);
    if(urlDatabase[key].userID === userID){
      found[key] = urlDatabase[key].longURL ;
    }
  }

  // console.log('found ', found);

  // if the object found is empty, pass the value -1
  if(Object.keys(found).length === 0){ found = -1;}

  return found;
}

// checks if the user is logged in
const isLoggedIn = (req, res, next)=>{
  users = {...req.cookies["users"]};
  // urlDatabase = {...req.cookies["urlDatabase"]};
  let templateVars = {
    user: users[req.cookies["user_id"]],
    error: ''
  };

  if(req.cookies["user_id"] === undefined){
    // templateVars.error = 'Please login';
    return res.redirect('/login');
  }

  return next();
};

//
const urlsExist = (req, res, next)=>{
  users = {...req.cookies["users"]};
  urlDatabase = {...req.cookies["urlDatabase"]};
  let templateVars = {
    user: users[req.cookies["user_id"]],
    error: ''
  };

  console.log('user ', templateVars.user);
  if(req.cookies["user_id"] === undefined){
    console.log('here');
    // window.alert('Please Login or Register');
    // req.flash =('error', 'Please Login or Register');
    return res.redirect('/login');
    // return res.render('user_login', templateVars);
  }

  // check if the user has URLs
  if(urlsForUser(req.cookies["user_id"]) === -1){
    // templateVars.urls = {};
    // templateVars.error = 'Please create URLs';
    return res.redirect('/urls/new');
    // return res.render('/urls/new', templateVars);
  }

  return next();
};

//
const isUserID = (req, res, next)=>{
  users = {...req.cookies["users"]};
  urlDatabase = {...req.cookies["urlDatabase"]};
  let templateVars = {
    user: users[req.cookies["user_id"]],
    error: ''
  };

  console.log('user ', templateVars.user);
  if(req.cookies["user_id"] === undefined){
    console.log('here');
    // window.alert('Please Login or Register');
    // req.flash =('error', 'Please Login or Register');
    return res.redirect('/login');
    // return res.render('user_login', templateVars);
  }

  // check if the user that is logged in is the same as the userID that created the URL
  // console.log(`
  //   req.params.shortURL: ${req.params.shortURL}
  //   urlDatabase[req.params.shortURL].userID: ${urlDatabase[req.params.shortURL].userID}
  //   req.cookies["user_id"]: ${req.cookies["user_id"]}
  //   `);

  if(urlDatabase[req.params.shortURL].userID !== req.cookies["user_id"]){
    // templateVars.urls = {};
    // templateVars.error = 'Please create URLs';
    return res.status(403).send(`Unauthorized`);
    // return res.render('/urls/new', templateVars);
  }

  return next();
};

// updates cookie
const updateCookie = (res, name, obj) => {
  res.clearCookie(name);
  res.cookie(name, obj);
}
/***************************************************************************
  Routes
***************************************************************************/
// sends the URLs json
app.get("/urls.json", (req, res) => {
  // users = {...req.cookies["users"]};
  urlDatabase = {...req.cookies["urlDatabase"]};
  res.json(urlDatabase);
});

// goes to the Hello World page
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// new URL page
app.get("/urls/new", isLoggedIn, (req, res) => {
  users = {...req.cookies["users"]};
  // urlDatabase = {...req.cookies["urlDatabase"]};
  res.render("urls_new", {user: users[req.cookies['user_id']]});
});

// deletes URL
app.post('/urls/:shortURL/delete', isUserID, (req, res) =>{
  if(res.statusCode === 200){
    // users = {...req.cookies["users"]};
    urlDatabase = {...req.cookies["urlDatabase"]};
    delete urlDatabase[req.params.shortURL];
    updateCookie(res, 'urlDatabase', urlDatabase);
  }
  res.redirect('/urls');
});

// updates the URL
app.post("/urls/:shortURL", isUserID, (req, res) => {
  if(res.statusCode === 200){
    users = {...req.cookies["users"]};
    urlDatabase = {...req.cookies["urlDatabase"]};
    urlDatabase[req.params.shortURL] = {};
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    urlDatabase[req.params.shortURL].userID = req.cookies['user_id'];
    updateCookie(res, 'urlDatabase', urlDatabase);
  }
  // console.log('Update urlDatabase ', urlDatabase);
  res.redirect('/urls');
});

// displays the URL
app.get("/urls/:shortURL", (req, res) => {
  // console.log('urlDatabase ', urlDatabase);
  users = {...req.cookies["users"]};
  urlDatabase = {...req.cookies["urlDatabase"]};
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

// posts new URL
app.post("/urls", isLoggedIn, (req, res) => {
  if(res.statusCode === 200){
    users = {...req.cookies["users"]};
    urlDatabase = {...req.cookies["urlDatabase"]};
    let newKey = generateRandomString();
    urlDatabase[newKey] = {
      longURL: req.body.longURL,
      userID: req.cookies["user_id"]
    };

    updateCookie(res, 'urlDatabase', urlDatabase);
    res.redirect(`/urls/${newKey}`);
  }else{
    res.redirect(`/urls/new`);
  }

});

// displays the URLs
app.get("/urls", (req, res) => {
// app.get("/urls", urlsExist, (req, res) => {
  // Cookies that have not been signed
  // console.log('Cookies: ', req.cookies)
  users = {...req.cookies["users"]};
  urlDatabase = {...req.cookies["urlDatabase"]};
  let urls = {};
  let templateVars = {
    urls: {},
    user: users[req.cookies["user_id"]],
    error: ''
  };

  console.log('here, get urls');
  // console.log('urls ', urls);
  // get the URLs only if the user is logged in
  if(req.cookies["user_id"]){
    // for(key in urlDatabase){
    //   templateVars.urls[key] = urlDatabase[key].longURL ;
    // }
    templateVars.urls = {...urlsForUser(req.cookies["user_id"])};
    templateVars.error = 'Please login or create URLs';
  }

  // console.log('urls from express: ', templateVars);
  res.render("urls_index", templateVars );
});

// goes redirect to the URL
app.get("/u/:shortURL", (req, res) => {
  urlDatabase = {...req.cookies["urlDatabase"]};

  // if(req.params.shortURL === undefined){
  //   res.redirect('/urls');
  // }else{
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
  // }

});

//login
app.get("/login", (req, res) => {
  res.render("user_login", {user: users[req.cookies["user_id"]]});
});
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // check if the input data are empty
  if(email === '' || password === ''){
    res.status(400).send('email and password cannot be empty');

  }else{
    if(res.statusCode === 200){
      users = {...req.cookies["users"]};
      let user = getUser(email);
      // check if email is unique
      if(user){
        if(user.password === password){
          res.cookie("user_id", user.id);
          res.redirect("/urls");
        }else{
          res.status(403).send(`Password doesn't match`);
        }
      }else{
        res.status(403).send('User not found');
      }
    }
  }
});

//logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  urlDatabase = {};
  res.redirect("/urls");
});

// signup
app.get("/register", (req, res) => {
  res.render("user_new", {user: ''});
});
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  console.log('here');

  // check if the input data are empty
  if(email === '' || password === ''){
    res.status(400).send('email and password cannot be empty');

  }else{
    // console.log('statusCode ', res.statusCode);

    if(res.statusCode === 200){
      users = {...req.cookies["users"]};

      // console.log('req.body ', req.body);

      // check if email is unique
      if(getUser(email)){
        // res.redirect(`/register`);
        res.status(400).send('email already exists');

      }else{
        // const { id } = req.body.username;
        const id = generateRandomString();
        // console.log(users);
        users[id] = {
          id,
          email,
          password
        };
        // console.log(users);
        res.cookie("user_id", id);
        updateCookie(res, 'users', users);
        res.redirect(`/urls`);
      }

    }
    // else{
    //   res.redirect(`/register`);
    //   res.status(400).send('email already exists');
    // }
  }
});

// root path
app.get("/", (req, res) => {
  let templateVars = { greeting: 'Hello World!' };
  res.render("hello_world", templateVars);
});

/***************************************************************************
  Listeners
***************************************************************************/
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});