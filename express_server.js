// git push -u origin master
/***************************************************************************
  Variables
***************************************************************************/
const bodyParser  = require("body-parser");
var express       = require("express");
var cookieParser  = require('cookie-parser');

var app     = express();
var PORT    = 8080;

var urlDatabase = {};

/***************************************************************************
  Initialization
***************************************************************************/
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

// app.use((req, res, next) => {
//   req.cookie('name', )
// });
/***************************************************************************
  Functions
***************************************************************************/
function generateRandomString() {
  return Math.random().toString(36).substring(7);
}

/***************************************************************************
  Routes
***************************************************************************/
// sends the URLs json
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// goes to the Hello World page
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// new URL page
app.get("/urls/new", (req, res) => {
  res.render("urls_new", {username: req.cookies['username']});
});

// deletes URL
app.post('/urls/:shortURL/delete', (req, res) =>{
  if(res.statusCode === 200){
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect('/urls');
});

// updates the URL
app.post("/urls/:shortURL", (req, res) => {
  if(res.statusCode === 200){
    urlDatabase[req.params.shortURL] = req.body.longURL;
  }
  console.log('Update urlDatabase ', urlDatabase);
  res.redirect('/urls');
});

// displays the URL
app.get("/urls/:shortURL", (req, res) => {
  // console.log('req.params.shortURL ', req.params.shortURL);
  // console.log('urlDatabase[req.params.shortURL] ', urlDatabase[req.params.shortURL])
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL] ,
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
});

// posts new URL
app.post("/urls", (req, res) => {
  if(res.statusCode === 200){
    let newKey = generateRandomString();
    urlDatabase[newKey] = req.body.longURL;

    res.redirect(`/urls/${newKey}`);
  }else{
    res.redirect(`/urls/new`);
  }

  // console.log(req.body);  // Log the POST request body to the console
  // res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

// displays the URLs
app.get("/urls", (req, res) => {
  // Cookies that have not been signed
  // console.log('Cookies: ', req.cookies)

  // Cookies that have been signed
  // console.log('Signed Cookies: ', req.signedCookies)

  let templateVars = {
    urls: urlDatabase,
    username: req.cookies['username']
  };
  // console.log('urls from express: ', templateVars);
  res.render("urls_index", templateVars);
});

// goes/redirect to the URL
app.get("/u/:shortURL", (req, res) => {
  // console.log('urlDatabase ', urlDatabase);
  // console.log('req.params ', req.params);

  // if(req.params.shortURL === undefined){
  //   res.redirect('/urls');
  // }else{
    const longURL = urlDatabase[req.params.shortURL];
    // console.log('urlDatabase[req.params.shortURL] ', urlDatabase[req.params.shortURL]);
    res.redirect(longURL);
  // }

});

// root path
app.get("/", (req, res) => {
  let templateVars = { greeting: 'Hello World!' };
  res.render("hello_world", templateVars);
});

//login
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});
//logout
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  urlDatabase = {};
  res.redirect("/urls");
});

/***************************************************************************
  Listeners
***************************************************************************/
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});