const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 9000;

app.use(
  cors({
    origin: [
      'http://localhost:5174',
      'http://localhost:5173',
      'https://shadhinmart.netlify.app',
    ],
    credentials: true,
  })
);

const uri = `mongodb+srv://${process.env.DB_ID}:${process.env.DB_PASS}@cluster0.p4xzv3m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
app.use(express.json());

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const productCollection = client.db('ShadhinMart').collection('products');

    app.get('/products', async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const search = req.query.search;
      const sort = req.query.sort;
      const minPrice = parseInt(req.query.minPrice);
      const maxPrice = parseInt(req.query.maxPrice);
      const brands = req.query.brands ? req.query.brands.split(',') : [];
      const categories = req.query.categories
        ? req.query.categories.split(',')
        : [];

      let query = {};
      if (search) {
        query.productName = { $regex: search, $options: 'i' };
      }
      if (brands.length > 0) {
        query.brand = { $in: brands };
      }
      if (categories.length > 0) {
        query.category = { $in: categories };
      }
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = minPrice;
        if (maxPrice) query.price.$lte = maxPrice;
      }

      let options = {};
      if (sort) {
        if (sort === 'lth') {
          options.sort = { price: 1 };
        } else if (sort === 'htl') {
          options.sort = { price: -1 };
        } else if (sort === 'date') {
          options.sort = { createdAt: 1 };
        }
      }

      const products = await productCollection
        .find(query, options)
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(products);
    });

    app.get('/productcount', async (req, res) => {
      const search = req.query.search;
      const brands = req.query.brands ? req.query.brands.split(',') : [];
      const categories = req.query.categories
        ? req.query.categories.split(',')
        : [];
      const minPrice = parseInt(req.query.minPrice);
      const maxPrice = parseInt(req.query.maxPrice);

      let query = {};
      if (search) {
        query.productName = { $regex: search, $options: 'i' };
      }
      if (brands.length > 0) {
        query.brand = { $in: brands };
      }
      if (categories.length > 0) {
        query.category = { $in: categories };
      }
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = minPrice;
        if (maxPrice) query.price.$lte = maxPrice;
      }
      const count = await productCollection.countDocuments(query);
      res.send({ count });
    });

    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.listen(port, () => {
  console.log(`Server is running at port ${port}`);
});
