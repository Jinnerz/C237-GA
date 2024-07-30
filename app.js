const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const multer = require('multer')
const app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images'); // Directory to save uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({storage: storage});

// Connecting to MYSQL
const connection = mysql.createConnection({
  // host: 'localhost',
  // user: 'root',
  // password: '',
  // database: 'c237_GA'
  host: 'sql.freedb.tech',
  user: 'freedb_freedb_C237_GA',
  password: '?$?Yrgs?*46g$aZ',
  database: 'freedb_c237_GA'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');

});

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// --------------------------------------------------------- HOME

// Route to the home page
app.get('/', function(req, res) {
  //To render the home.ejs
    res.render('home');
});

// --------------------------------------------------------- PRODUCTS

// Route to all the products page
app.get('/user/:id/products', function(req, res) {
  // From the login page, request for userid
  const userId = req.params.id;
  const sql = 'SELECT * FROM products WHERE userId = ?';
  // Fetch data from MySQL
  connection.query(sql, [userId], (error, results) => {
    if(error) {
      console.error('Database query error:', error.message);
      return res.status(500).send('Error retrieving products');
    }
    // Render HTML page with data
    res.render('allproduct', { products: results, userId: userId}); // Extra userId: userId written such that the referenced navbar knows whether to go to /user/1 or /user/2
  });
});

// Route to get a specific product by ID
app.get('/user/:userId/products/:productId', function(req, res) {
  // Extract the user ID from the request parameters
  const userId = req.params.userId;
  // Extract the product ID from the request parameters
  const productId = req.params.productId;
  

  const sql = 'SELECT * FROM products WHERE productId = ? AND userId = ?';
  // Fetch data from MySQL based on the product ID
  connection.query( sql, [productId, userId], (error, results) => {
      if (error) {
          console.error('Database query error:', error.message);
          return res.status(500).send('Error Retrieving product by ID');
      }
      // Check if any product with the given ID was found
      if (results.length > 0) {
          // render HTML page with the product data
          res.render('oneproduct', { product: results[0], userId: userId});
      } else {
          // If no product with the given ID was found, render a 404 page or handle it accordingly
          res.status(404).send('Product not found');
      }
  });
});

// Add a new product form
app.get('/user/:userId/addProduct', function(req, res) {
  // userId is extracted from request, as the form also has navbar, which requires referencing
  const userId = req.params.userId;

  // render HTML page of product form
  res.render('addproduct', {userId: userId});
});

// Add a new product
app.post('/user/:userId/addProduct', upload.single('image'), function(req, res) {
  // userId extracted, to use in WHERE statements
  const userId = req.params.userId;
  // Extract product data from the request body
  const {productName, productDescription, creationDate, price} = req.body;
  let image;
  if (req.file) {
    image = req.file.filename; // Save only the filename
  } else {
    image = null;
  }

  //UserId included in insert, as to specify which user inserted which product in the database
  const sql = 'INSERT INTO products (userId, productName, productDescription, creationDate, image, price) VALUES (?, ?, ?, ?, ?, ?)';
  // Insert the new product into the database
  connection.query( sql, [userId, productName, productDescription, creationDate, image, price], (error, results) => {
      if (error) {
          // Handle any error that occurs during the database operation
          console.error("Error adding product:", error);
          res.status(500).send('Error adding product');
      } else {
          // Send a success response
          res.redirect(`/user/${userId}/products`);
      }
  });
});

// To get the page that contains the form to change the product details
app.get('/user/:userId/editProduct/:productId', (req, res) => {
  // User Id is extracted for navbar
  const userId = req.params.userId
  
  // Product Id is extracted to find correct products
  const productId = req.params.productId;

  const sql = 'SELECT * FROM products WHERE productId = ? AND userId = ?';

  // Fetch data from MySQL based on the product ID
  connection.query(sql, [productId, userId], (error, results) => {
      if (error) {
          console.error('Database query error:', error.message);
          return res.status(500).send('Error retrieving product by ID');
      }
      // Check if any product with the given ID was found
      if (results.length > 0) {
          // Render HTML page with the product data
          res.render('editProduct', {product: results[0], userId: userId}); //userId referenced for navbar
      } else {
          // If no product with the given ID was found, render a 404 page or handle it accordingly
          res.status(404).send('Product not found');
      }
  });
});

// Changes done to the Edited products is updated
app.post('/user/:userId/editProduct/:productId', upload.single('image'), (req, res) => {
  // User ID extracted to ensure proper post
  const userId = req.params.userId;
  const productId = req.params.productId;
  // Extract product data from the request body
  const { productName, productDescription, price} = req.body;
  let image = req.body.currentImage; //retrieve current image filename
  if(req.file) { //if new image is uploaded
      image = req.file.filename; //set image to be new image filename
  }

  const sql = 'UPDATE products SET productName = ?, productDescription = ?, price = ?, image = ? WHERE productId = ? AND userId = ?';

  // Insert the new product into the database
  connection.query(sql, [productName, productDescription, price, image, productId, userId], (error, results) => {
      if (error) {
          // Handle any error that occurs during the database operation
          console.error("Error updating product:", error);
          res.status(500).send('Error updating product');
      } else {
          // Send a success response
          res.redirect(`/user/${userId}/products`);
      }
  });
});

//Deleting a product by their ID
app.get('/user/:userId/deleteProduct/:productId', (req, res) => {
  // Extracting user id from parameters to use for proper redirection
  const userId = req.params.userId;
  const productId = req.params.productId;
  const sql = 'DELETE FROM products WHERE productId = ? AND userId = ?';
  connection.query(sql, [productId, userId], (error, results) => {
      if (error) {
          // Handle any error that occurs during the database operation
          console.error("Error deleting product:", error);
          res.status(500).send('Error deleting product');
      } else {
          // Send a success response
          res.redirect(`/user/${userId}/products`);
      }
  });
});

// --------------------------------------------------------- ACCOUNT

app.get('/user/:id', (req, res) => {
  // Extract the account ID from the request parameters
  const userId = req.params.id;
  const sql = 'SELECT * FROM accounts WHERE userId = ?';
  // Fetch data from MySQL based on the product ID
  connection.query( sql, [userId], (error, results) => {
    if(error) {
      console.error('Database query error:', error.message);
      return res.status(500).send('Error Retrieving user by ID');
    }
    // Check if any user with the given ID was found
    if (results.length > 0) {
      // Render HTML page with the user data
      res.render('userinfo', {user: results[0], userId: userId}); //sending userId into userinfo as well, for a working navbar
    } else {
      // If no user with the given ID was found, render a 404 page or handle it accordingly
      res.status(404).send('User not found');
    }
  });
});

app.get('/user/:userId/editAccount', (req, res) => {
  const userId = req.params.userId;
  const sql = 'SELECT * FROM accounts WHERE userId = ?';

  // Fetch data from MySQL based on the user ID
  connection.query(sql, [userId], (error, results) => {
    if(error) {
      console.error('Database query error:', error.message);
      return res.status(500).send('Error retrieving user by ID');
    }
    // Check if any user with the given ID was found
    if (results.length > 0) {
      // Render HTML page with the user data
      res.render('editAccount', {user: results[0], userId: userId}); //userId passed into editAccount for navbar to work
    } else {
      // If no user with the given ID was found, render a 404 or handle it accordingly
      res.status(404).send('User not found');
    }
  });
});

app.post('/user/:userId/editAccount', upload.single('image'), (req, res) => {
  const userId = req.params.userId;
  // Extract user data from the request body
  const {firstName, lastName, email, contact, age} = req.body;
  let image = req.body.currentImage; //Retrieve current image filename
  if(req.file) { //if new image is uploaded
    image = req.file.filename; //set image to be new image filename
  }

  const sql = 'UPDATE accounts SET firstName = ?, lastName = ?, email = ?, contact = ?, age = ?, image = ? WHERE userId = ?';

  //Insert the new user info into the database
  connection.query(sql, [firstName, lastName, email, contact, age, image, userId], (error, results) => {
    if (error) {
      console.error("Error updating user:", error);
      res.status(500).send('Error updating user');
    } else {
      // Send a success response
      res.redirect(`/user/${userId}`); // `${}` used to go back to proper redirectory
    }
  });
});

// --------------------------------------------------------- LOG IN

app.get('/loginpage', (req, res) => {
  // To render the loginpage
  res.render('login');
});

app.post('/loginpage', (req, res) =>{
  // The code takes the username and password from the request body
  const { username, password} = req.body;
  const sql = 'SELECT * FROM accounts WHERE username = ? AND password = ?';

  connection.query(sql, [username, password], (error, results) => {
    if(error) {
      console.error('Database query error:', error.message);
      return res.status(500).send('Error retrieving user by ID');
    }
    if (results.length >0) {
      const userId = results[0].userId;
      res.redirect(`/user/${userId}/products`);
    } else {
      res.status(401).send('Incorrect username or password');
    }
  });
});

// Start the server and listen on the specified port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

