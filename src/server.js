/***********************
  Load Components!

  Express      - A Node.js Framework
  Body-Parser  - A tool to help use parse the data in a post request
  Pg-Promise   - A database tool to help use connect to our PostgreSQL database
***********************/
var express = require('express'); //Ensure our express framework has been added
var app = express();
var bodyParser = require('body-parser'); //Ensure our body-parser tool has been added
app.use(bodyParser.json());              // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
const axios = require('axios');

//Create Database Connection
var pgp = require('pg-promise')();

/**********************
  Database Connection information
  host: This defines the ip address of the server hosting our database.
		We'll be using `db` as this is the name of the postgres container in our
		docker-compose.yml file. Docker will translate this into the actual ip of the
		container for us (i.e. can't be access via the Internet).
  port: This defines what port we can expect to communicate to our database.  We'll use 5432 to talk with PostgreSQL
  database: This is the name of our specific database.  From our previous lab,
		we created the football_db database, which holds our football data tables
  user: This should be left as postgres, the default user account created when PostgreSQL was installed
  password: This the password for accessing the database. We set this in the
		docker-compose.yml for now, usually that'd be in a seperate file so you're not pushing your credentials to GitHub :).
**********************/
const dev_dbConfig = {
	host: 'db',
	port: 5432,
	database: process.env.POSTGRES_DB,
	user:  process.env.POSTGRES_USER,
	password: process.env.POSTGRES_PASSWORD
};

/** If we're running in production mode (on heroku), the we use DATABASE_URL
 * to connect to Heroku Postgres.
 */
const isProduction = process.env.NODE_ENV === 'production';
const dbConfig = isProduction ? process.env.DATABASE_URL : dev_dbConfig;

// Heroku Postgres patch for v10
// fixes: https://github.com/vitaly-t/pg-promise/issues/711
if (isProduction) {
  pgp.pg.defaults.ssl = {rejectUnauthorized: false};
}

const db = pgp(dbConfig);

// set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/'));//This line is necessary for us to use relative paths and access our resources directory

app.get('/', function(req, res) {
    res.render('pages/home', {
      my_title: "Sam's Project",
      items: '',
      error: false,
      message: ''
    });
    
  });

app.get('/reviews', function(req, res) {

  var query = "SELECT * FROM reviews;";

  db.any(query)
  .then(function(rows) {
    res.render('pages/reviews', {
      my_title: "Sam's Project",
      data: rows,
      
    })

  })
  .catch(function(err) {
    console.log('error', err);
    res.render('pages/reviews.ejs', {
      my_title: "Title",
      error: true
    })
  })



});



  app.post('/get_feed', function(req, res) {
    var title = req.body.title; //TODO: Remove null and fetch the param (e.g, req.body.param_name); Check the NYTimes_home.ejs file or console.log("request parameters: ", req) to determine the parameter names
    if(title) {
      axios({
        url: `http://www.themealdb.com/api/json/v1/1/search.php?s=${title}`,
          method: 'GET',
          dataType:'json',
        })
          .then(items => {
            // TODO: Return the reviews to the front-end (e.g., res.render(...);); Try printing 'items' to the console to see what the GET request to the Twitter API returned.
            // Did console.log(items) return anything useful? How about console.log(items.data.results)?
            // Stuck? Look at the '/' route above
            res.render('pages/home', {
              my_title: 'recipie search',
              items: items.data.meals[0],
              error: false,
              message: 'good'
            })
          })
          .catch(error => {

            console.log(error);
            res.render('pages/home',{
              my_title: "recipie search",
              items: '',
              error: true,
              message: "Recipe Not Found"
            })
          });
  
  
    }
    else {
      // TODO: Render the home page and include an error message (e.g., res.render(...);); Why was there an error? When does this code get executed? Look at the if statement above
      // Stuck? On the web page, try submitting a search query without a search term
      res.render('pages/home', {
        my_title: "recipe search",
        items: '',
        error: true,
        message: 'No Search'
      })
    }
  });

app.post('/get_feed/review', function(req, res) {
  var tv_show = req.body.hidden_name;
  var review = req.body.reviewText;
  
  var insert = "INSERT INTO reviews(tv_show, review, review_date) VALUES('"+tv_show+"', '"+review+"', CURRENT_TIMESTAMP);"
  var query = "SELECT * FROM reviews;"

  db.task('get-everything', task => {
    return task.batch([
      task.any(insert),
      task.any(query)
    ]);
  })
  .then(info => {
    res.render('pages/reviews', {
      my_title: "reviews",
      data: info[1]
    })
  })
  .catch(err => {
    console.log('error', err)
    res.render('pages/reviews', {
      my_title: "reviews", 
      data: ''
    })
  })
});

app.post('/search', function(req, res) {
  var title = req.body.title;

  var query = "SELECT * FROM reviews WHERE tv_show= '"+title+"';";
  var query_2 = "SELECT * FROM reviews;";

  if(title){
    db.any(query)
      .then(function(rows) {
        if(rows.length == 0)
        {
          db.any(query_2)
            .then(function(rows) {
              res.render('pages/reviews', {
                my_title: "Reviews",
                data: rows
              })
            })
            .catch(function(err) {
              res.render('pages/reviews', {
                my_title: "Reviews",
                error: true
              })
            })
        }
        else{
          res.render('pages/reviews', {
            my_title: "Reviews",
            data: rows
          })
        }
      })
      .catch(function(err) {
        console.log('error', err);
        res.render('pages/reviews', {
          my_title: "Title",
          error: true
        })
      })

  }
});



//app.listen(3000);
const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`Express running → PORT ${server.address().port}`);
});