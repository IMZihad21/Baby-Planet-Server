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

        app.get('/products', async (req, res) => {
            const cursor = productsDB.find({});
            if ((await cursor.count()) === 0) {
                res.send([]);
            }
            else {
                const products = await cursor.toArray();
                res.json(products);
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