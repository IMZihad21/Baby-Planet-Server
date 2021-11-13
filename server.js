const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors')
const admin = require("firebase-admin");
const ObjectId = require('mongodb').ObjectId;

// Read from ENV
require('dotenv').config();
const port = process.env.PORT || 9000;
const uri = process.env.MONGODB_URI;
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Initialize App
const app = express();
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Middleware
app.use(cors());
app.use(express.json());

// Connection to MongoDB
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const verifyToken = async (req, res, next) => {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[ 1 ];

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {
        }
    }
    next();
}

const dbConnect = async () => {
    try {
        await client.connect();
        const babyCare = client.db("babyCare");
        const productsDB = babyCare.collection('products');
        const ordersDB = babyCare.collection('orders');
        const reviewsDB = babyCare.collection('reviews');
        const usersDB = babyCare.collection('users');

        // Products
        app.get('/products', async (req, res) => {
            const cursor = productsDB.find({});
            if ((await cursor.count()) === 0) {
                res.json([]);
            }
            else {
                const products = await cursor.toArray();
                const orderedProducts = products.reverse();
                res.json(orderedProducts);
            }
        });

        app.get('/products/:productID', async (req, res) => {
            const productID = req.params.productID;
            const query = { _id: ObjectId(productID) };
            const dress = await productsDB.findOne(query);
            res.json(dress);
        });

        app.post('/products', async (req, res) => {
            const result = await productsDB.insertOne(req.body);
            res.json(result);
        });

        app.delete('/products', async (req, res) => {
            const productID = req.query.productID;
            const query = { _id: ObjectId(productID) };
            const result = await productsDB.deleteOne(query);
            res.json(result);
        });

        // Orders
        app.get('/orders', verifyToken, async (req, res) => {
            const email = req.decodedEmail;
            const query = { clientEmail: email }
            const cursor = ordersDB.find(query);
            const orders = await cursor.toArray();
            res.json(orders);
        });

        app.post('/orders', async (req, res) => {
            const result = await ordersDB.insertOne(req.body);
            res.json(result);
        });

        app.delete('/orders', async (req, res) => {
            const orderID = req.query.orderID;
            const query = { _id: ObjectId(orderID) };
            const result = await ordersDB.deleteOne(query);
            res.json(result);
        });

        app.put('/orders', async (req, res) => {
            const orderID = req.query.orderID;
            const query = { _id: ObjectId(orderID) };
            const updateDoc = { $set: { orderPending: false } };
            const options = { upsert: true };
            const result = await ordersDB.updateOne(query, updateDoc, options);
            res.json(result);
        });

        app.get('/allorders', verifyToken, async (req, res) => {
            const cursor = ordersDB.find({});
            const orders = await cursor.toArray();
            res.json(orders);
        });

        // Reviews
        app.get('/reviews', async (req, res) => {
            const cursor = reviewsDB.find({});
            if ((await cursor.count()) === 0) {
                res.send([]);
            }
            else {
                const reviews = await cursor.toArray();
                const orderedReviews = reviews.reverse();
                res.json(orderedReviews);
            }
        });

        app.post('/reviews', async (req, res) => {
            const result = await reviewsDB.insertOne(req.body);
            res.json(result);
        });

        // Users
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersDB.findOne(query);
            res.json({ isAdmin: user?.isAdmin ? user.isAdmin : false });
        })

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersDB.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        app.put('/users/admin', verifyToken, async (req, res) => {
            const { email } = req.body;
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await usersDB.findOne({ email: requester });
                if (requesterAccount.isAdmin === true) {
                    const filter = { email };
                    const updateDoc = { $set: { isAdmin: true } };
                    const result = await usersDB.updateOne(filter, updateDoc);
                    res.json(result);
                }
            }
            else {
                res.status(403).json({ message: 'you do not have access to make admin' })
            }

        })
    }
    finally {
        console.log('Connection to MongoDB successfull');
    }
}

dbConnect();

app.get('/', (req, res) => {
    res.send('API for Baby Care App is LIVE!')
});

app.listen(port, () => {
    console.log(`Baby Care app listening at port: ${port}`)
});