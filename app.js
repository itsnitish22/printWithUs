const express = require('express');
const app = express();
const path = require("path");
const fs = require('fs');
const usermodel = require('./models/customer.js')
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const cookieparser = require('cookie-parser');
const customer = require('./models/customer.js');
const pdf = require('pdf-page-counter');
const multer = require('multer');
const Order = require('./models/ordermodel.js');
const uploads = multer({ dest: 'uploads/' })
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require('gridfs-stream')
const mongoose = require('mongoose');
var bodyParser = require('body-parser');
const MongoClient = require("mongodb").MongoClient;
const GridFSBucket = require("mongodb").GridFSBucket;
const { Readable } = require('stream');
const Shopkeeper = require("./models/shopkeeper.js");
const shopkeeper = require('./models/shopkeeper.js');
const ordermodel = require('./models/ordermodel.js');

// mongoose.connect('mongodb://localhost:27017/printWithUs', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
//   });

//   const conn = mongoose.connection;
// conn.on('error', console.error.bind(console, 'Connection error:'));
// conn.once('open', () => {
//   console.log('MongoDB connected');
// });








app.set("view engine", "ejs");

// app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieparser()); // Add this to parse cookies in requests

const mongoURI = `mongodb://localhost:27017/printWithUs`;

MongoClient.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        db = client.db("printWithUs");
        bucket = new GridFSBucket(db, { bucketName: 'uploads' });
        console.log(`Connected to database: ${"printWithUs"}`);
    })
    .catch(err => console.error(err));

const storage = multer.memoryStorage();
const upload = multer({ storage });







app.get('/login', function (req, res) {
    res.render("login.ejs");
})
app.get('/', function (req, res) {
    res.render("select_role.ejs");
})
app.post('/register', async function (req, res) {
    let user = await usermodel.findOne({ email: req.body.email });
    if (user) { res.status(404).send("User Already exsist") }
    else {
        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(req.body.password, salt, async function (err, hash) {
                // Store hash in your password DB.
                let createduser = await usermodel.create({
                    email: req.body.email,
                    username: req.body.username,
                    password: hash,

                })
                let token = jwt.sign({ email: req.body.email, userId: createduser._id }, "shhhhh");
                res.cookie("token", token);
                // res.send("registered");

                res.render("home", { createduser });
            });
        });
    }
})
app.post('/register/shopkeeper', async function (req, res) {
    let user = await Shopkeeper.findOne({ email: req.body.email });
    if (user) { res.status(404).send("User Already exsist") }
    else {
        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(req.body.password, salt, async function (err, hash) {
                // Store hash in your password DB.
                let createduser = await Shopkeeper.create({
                    email: req.body.email,
                    username: req.body.username,
                    password: hash,

                })
                let token = jwt.sign({ email: req.body.email, userId: createduser._id }, "shhhhh");
                res.cookie("token", token);
                // res.send("registered");

                res.render("shopkeeper", { createduser });
            });
        });
    }
})
app.post('/login', async function (req, res) {
    let user = await usermodel.findOne({ username: req.body.username });
    console.log(user);
    if (user == null) { res.send('something went wrong'); }
    else {
        bcrypt.compare(req.body.password, user.password, function (err, result) {
            if (result) {
                let token = jwt.sign({ email: user.email, userid: user._id }, 'ssssssg');
                res.cookie('token', token);

                res.render("home", { user });
            }
            else {
                res.send("Incorrect Password")
            }
        })
    }
})
app.post('/login/shopkeeper', async function (req, res) {
    let user = await Shopkeeper.findOne({ username: req.body.username });
    console.log(user);
    if (user == null) { res.send('something went wrong'); }
    else {
        bcrypt.compare(req.body.password, user.password, function (err, result) {
            if (result) {
                let token = jwt.sign({ email: user.email, userid: user._id }, 'ssssssg');
                res.cookie('token', token);

                res.render("shopkeeper", { user, Order });
            }
            else {
                res.send("Incorrect Password")
            }
        })
    }
})
app.get("/logout", async function (req, res) {

    res.cookie("token", "");
    res.redirect("/login");
})
app.get('/register', function (req, res) {
    res.render("register.ejs");
})
app.get('/home', function (req, res) {
    res.render("home.ejs");
})
app.get('/index', function (req, res) {
    res.render("index.ejs");
})
app.get('/order', (req, res) => {
    res.render('order', { filename: null, pdfname: null }); // Initial rendering with no file uploaded
});
app.get('/shopkeeper', isloggedIn, async (req, res) => {
    try {
        const shopkeeperId = req.user.userId; // Extract shopkeeper's ID from JWT
        const orders = await Order.find({ shopkeeper: shopkeeperId }); // Fetch all orders associated with the shopkeeper
        console.log(shopkeeperId);

        // Pass both user and orders to the EJS template
        res.render('shopkeeperorder', { user: req.user, orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/login/shopkeeper', (req, res) => {
    res.render('shopkeeperlogin'); // Initial rendering with no file uploaded
});
app.get('/register/shopkeeper', (req, res) => {
    res.render('shopkeeperregister'); // Initial rendering with no file uploaded
});

app.post('/upload', upload.single('file_upload'), (req, res) => {
    const readableFileStream = new Readable();
    readableFileStream.push(req.file.buffer);
    readableFileStream.push(null);

    const uploadStream = bucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype // Set contentType based on the file's MIME type
    });

    readableFileStream.pipe(uploadStream)
        .on('error', (err) => {
            console.error(err);
            res.status(500).json({ message: 'Error uploading file' });
        })
        .on('finish', () => {
            // Make sure to pass both pdfname and filename
            res.render("order.ejs", {
                pdfname: uploadStream.id || null,  // GridFS file ID or null
                filename: req.file ? req.file.originalname : null // File name or null
            });
        });
});



app.post('/createorder', async (req, res) => {
    try {
        // Find the user by email
        let user = await usermodel.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).send({ message: "User not found. Enter the same email as of login" });
        }

        const pdfFileId = req.body.pdfname;
        const filename = req.body.filename;
        if (!pdfFileId) {
            return res.status(400).send({ message: "No file uploaded" });
        }

        // Create a new order
        const order = await Order.create({
            Name: req.body.name,
            Contact_Number: req.body.contact,
            Email: req.body.email,
            Preferred_Time_Slot: req.body.orderTime,
            Select_Service: req.body.service,
            Number_of_Copies: req.body.copies,
            Paper_Size: req.body.paper_size,
            file: {
                _id: pdfFileId,
                filename: filename,
                contentType: 'application/pdf'
            },
            user: user._id,
            status: "Pending", // Set initial status to "Pending"
        });

        // Add the order ID to the user's printing_file array
        user.printing_file.push(order._id);
        await user.save();

        // Pass the orderId to the payment form
        res.status(201).render("paymentform.ejs", { orderId: order._id, amount: req.body.amount });
    } catch (err) {
        console.error(err);
        res.status(400).send({ error: err.message });
    }
});



app.get('/file/:filename', (req, res) => {
    const { filename } = req.params;

    // Find the file in GridFS
    bucket.find({ filename }).toArray((err, files) => {
        if (err) {
            return res.status(500).send('Error fetching file');
        }

        if (!files || files.length === 0) {
            return res.status(404).send('File not found');
        }

        const file = files[0];

        // Check if the file is a PDF
        if (file.contentType === 'application/pdf') {
            const downloadStream = bucket.openDownloadStreamByName(filename);
            res.set('Content-Type', 'application/pdf');
            downloadStream.pipe(res);
        } else {
            res.status(404).send('Not a PDF file');
        }
    });
});



function isloggedIn(req, res, next) {
    const token = req.cookies.token;
    if (!token || token === "") {
        return res.redirect("/login");
    }

    try {
        let data = jwt.verify(token, "shhhhh");
        req.user = data;
        next();
    } catch (err) {
        console.log(err);
        res.redirect("/login");
    }
}

app.get('/payment', (req, res) => {
    res.render('paymentform');
});

// Handle payment submission
app.post('/payment', async (req, res) => {
    const { amount, cardNumber, expiryDate, cvv } = req.body;

    // Simulate payment processing logic
    if (cardNumber === '1234 5678 9012 3456' && cvv === '123') {
        // res.render('success', { amount });
        // Assuming shopkeeper's email or ID is available
        const shopkeeper = await Shopkeeper.findOne({ email: 'shopkeeper1@gmail.com' });
        if (shopkeeper) {
            // Add the order to the shopkeeper's list
            shopkeeper.printing_file.push(req.body.orderId);  // order._id is the order ID
            await shopkeeper.save();
            res.render('success', { amount });
        }

    } else {
        res.render('failed');
    }
});
app.get('/order/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId).populate('user').populate('shopkeeper');
        if (!order) {
            return res.status(404).send('Order not found');
        }
        res.render('shopOrderdetail', { order });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).send('Internal Server Error');
    }
});



app.listen(3000);
