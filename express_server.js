// git push -u origin master
/***************************************************************************
  Variables
***************************************************************************/
const bodyParser      = require("body-parser");
const express         = require("express");
const cookieParser    = require('cookie-parser');
const bcrypt          = require('bcrypt');
const cookieSession   = require('cookie-session');
const methodOverride  = require('method-override');

const app             = express();
const PORT            = process.env.PORT || 8080;

/***************************************************************************
  Data
***************************************************************************/
// urlDB keys:
//    longURL       - string
//    userID        - string
//    createdAt     - date
//    visitors      - object and has the userID as a key
//      visitedAt   - array of date
const urlDB = {};

// usersDB keys:
//    id            - string
//    email         - string
//    password      - string
const usersDB = {};

/***************************************************************************
  Cookies
***************************************************************************/
// userID
// visitorID

/***************************************************************************
  Initialization
***************************************************************************/
app.set("view engine", "ejs");
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

// override with POST having ?_method=DELETE
app.use(methodOverride('_method'));

/***************************************************************************
  Functions
***************************************************************************/
const generateRandomString = () => Math.random().toString(36).substring(7);

// gets user by e-mail
const getUser = email => {

  let found = undefined;

  for(user in usersDB){
    if(usersDB[user].email === email){
      found = usersDB[user];
      break;
    }
  }

  return found;
}

const getVisitors = (urlID) => {

  const visitors = [];
  var uniqueVisitors = 0;

  for(let key in urlDB[urlID].visitors){
    urlDB[urlID].visitors[key].visitedAt.forEach( currentVisitedAt => {
        visitors.push({
          visitorID: key,
          visitedAt: currentVisitedAt
        });
    });
    uniqueVisitors ++;
  }

  return {
    visitors,
    uniqueVisitors
  }
}

// gets the user's URLs
const urlsForUser = userID => {

  let found = {};

  for(key in urlDB){
    const { visitors, uniqueVisitors } = getVisitors(key);

    if(urlDB[key].userID === userID){
      found[key] = {
        longURL: urlDB[key].longURL,
        createdAt: convertDate(urlDB[key].createdAt),
        visitors: visitors.length,
        uniqueVisitors
      };
   }
  }

  // if the object found is empty, pass the value -1
  if(Object.keys(found).length === 0){ found = -1;}

  return found;
}

// checks if user is logged in
const isUserLoggedIn = (id) => (id === '' || id === undefined) ?  false : true;

// update DB with cookie or create cookie
const updatedB = (req) => {

  if(! req.session.hasOwnProperty('user_id')){
    req.session.user_id = '';
  }
}

const createDate = () => {
  return ( new Date ) ;
}

const convertDate = (date) => {
  return date.toString().substr(0, 24);
}

const setURLsVisitors = (userId, urlId, req) => {
  if(!userId){
    // set cookie in case the browser doesn't have one for the visitor
    if(!req.session.hasOwnProperty('visitorID')){
      req.session['visitorID'] = generateRandomString();
    }

    userId = req.session.visitorID;
  }

  // insert URL visitor
  if(urlDB[urlId]){
    if(!urlDB[urlId].hasOwnProperty('visitors')){
      urlDB[urlId]['visitors'] = {};
    }

    if(! urlDB[urlId].visitors.hasOwnProperty(userId)){
      urlDB[urlId].visitors[userId] = {
        visitedAt: []
      };
    }

    urlDB[urlId].visitors[userId].visitedAt.push(createDate());
  }
}
/***************************************************************************
  Middlewares
***************************************************************************/

// checks if the user is logged in
const isLoggedIn = (req, res, next)=>{

  if(!isUserLoggedIn(req.session.user_id)){
    return res.redirect('/login');
  }

  return next();
};

// checks if the user that is calling the method is the same that created
// the URL
const isUserID = (req, res, next)=>{

  if(!isUserLoggedIn(req.session.user_id)){
    return res.redirect('/login');
  }

  if(urlDB[req.params.id].userID !== req.session.user_id){
    return res.status(403).send(`Unauthorized`);
  }

  return next();
};

app.use((req, res, next)=>{

  updatedB(req);

  next();
});
/***************************************************************************
  Routes
***************************************************************************/
// GET ---------------------------------------------------------------------

// sends the URLs json
app.get("/urls.json", (req, res) => {
  res.json(urlDB);
});

// goes to the Hello World page
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// new URL page
app.get("/urls/new", isLoggedIn, (req, res) => {
  res.render("urls_new", {user: usersDB[req.session.user_id]});
});

// displays the URL
app.get("/urls/:id", (req, res) => {

  // if cannot find url redirect to the main page
  if(!urlDB[req.params.id]){
    return res.status(403).send(`URL id not found`);
  }

  // get userID
  var userId = '';

  if(req.session.hasOwnProperty('user_id')){
    userId = req.session.user_id;
  }

  // get URL visitors
  let { visitors, uniqueVisitors } = getVisitors(req.params.id);

  const sortedVisitors = visitors.sort( ( a, b ) => b.visitedAt - a.visitedAt);
  visitors = sortedVisitors.map(visitor => {
    const visitedAt = convertDate(visitor.visitedAt);

    return {
      visitorID: visitor.visitorID,
      visitedAt
    }
  });

  // set template to render the page
  const templateVars = {
    id: req.params.id,
    longURL: urlDB[req.params.id].longURL,
    user: usersDB[userId],
    createdAt: convertDate(urlDB[req.params.id].createdAt),
    visitors,
    uniqueVisitors
  };

  res.render("urls_show", templateVars);
});

// displays the URLs
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: {},
    user: usersDB[req.session.user_id],
    error: ''
  };

  if(req.session.user_id){
    templateVars.urls = {...urlsForUser(req.session.user_id)};
  }

  res.render("urls_index", templateVars );
});

// goes redirect to the URL
app.get("/u/:id", (req, res) => {

  // if cannot find url redirect to the main page
  if(!urlDB[req.params.id]){
    return res.status(403).send(`URL id not found`);
  }

  // get userID
  var userId = '';

  if(req.session.hasOwnProperty('user_id')){
    userId = req.session.user_id;
  }

  setURLsVisitors(userId, req.params.id, req);

  const longURL = urlDB[req.params.id].longURL;
  res.redirect(longURL);

});

//login
app.get("/login", (req, res) => {
  res.render("user_login", {user: usersDB[req.session.user_id]});
});

// signup
app.get("/register", (req, res) => {
  res.render("user_new", {user: ''});
});

// root path
app.get("/", (req, res) => {
  if(req.session.user_id){
    res.redirect('/urls');
  }else{
    res.redirect('/login');
  }
  // const templateVars = { greeting: 'Hello World!' };
  // res.render("hello_world", templateVars);
});

// POST --------------------------------------------------------------------

// posts new URL
app.post("/urls", isLoggedIn, (req, res) => {

  if(res.statusCode === 200){

    const newKey = generateRandomString();

    urlDB[newKey] = {
      longURL: req.body.longURL,
      userID: req.session.user_id,
      createdAt: createDate()
    };

    res.redirect(`/urls/${newKey}`);

  }else{
    res.redirect(`/urls/new`);
  }

});

// login
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // check if the input data are empty
  if(email === '' || password === '' || email.replace(/\s/g, '') === '' || password.replace(/\s/g, '') === ''){
    return res.status(400).send('email and password cannot be empty');
  }

  if(res.statusCode === 200){

    const user = getUser(email);

    // check if email is unique
    if(! user){
      return res.status(403).send('User not found');
    }

    if(bcrypt.compareSync( password, user.password)){
      req.session.user_id = user.id;
      res.redirect("/urls");
    }else{
      res.status(403).send(`Password doesn't match`);
    }
  }
});

//logout
app.post("/logout", (req, res) => {
  req.session.user_id = '';
  res.redirect("/urls");
});

// signup
app.post("/register", (req, res) => {
  const { email, password } = req.body;

  // check if the input data are empty
  if(email === '' || password === ''  || email.replace(/\s/g, '') === '' || password.replace(/\s/g, '') === ''){
    return res.status(400).send('email and password cannot be empty');
  }

  if(res.statusCode === 200){

    // check if email is unique
    if(getUser(email)){
      return res.status(400).send('email already exists');
    }

    const id = generateRandomString();

    usersDB[id] = {
      id,
      email,
      password: bcrypt.hashSync(password, 10)
    };

    req.session.user_id = id;
    res.redirect(`/urls`);

  }
});

// PUT ---------------------------------------------------------------------

// updates the URL
app.put("/urls/:id", isUserID, (req, res) => {

  if(res.statusCode === 200){
    // urlDB[req.params.id] = {};
    urlDB[req.params.id].longURL = req.body.longURL;
    urlDB[req.params.id].userID = req.session.user_id;
  }

  res.redirect('/urls');
});

// DELETE ------------------------------------------------------------------

// deletes URL
app.delete('/urls/:id', isUserID, (req, res) =>{

  if(res.statusCode === 200){
    delete urlDB[req.params.id];
  }
  res.redirect('/urls');

});

/***************************************************************************
  Listeners
***************************************************************************/
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});