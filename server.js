const express = require('express');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const cors = require('cors')
const ObjectId = require('mongodb').ObjectId;

// Initialize App
const app = express();
dotenv.config();

// Middleware
app.use(cors());
app.use(express.json());

// Read from ENV
const port = process.env.PORT || 9000;
const uri = process.env.MONGODB_URI;

// Connection to MongoDB
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const dbConnect = async () => {
    try {
        await client.connect();
        const babyCare = client.db("babyCare");
        const productsDB = babyCare.collection('products');
        const ordersDB = babyCare.collection('orders');
        const reviewsDB = babyCare.collection('reviews');

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

        app.post('/orders', async (req, res) => {
            const result = await ordersDB.insertOne(req.body);
            res.json(result);
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