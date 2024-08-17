const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 9000;

app.use(
  cors({
    origin: [
      'http://localhost:5174',
      'http://localhost:5173',
      'https://assettrackerpro.netlify.app',
    ],
    credentials: true,
  })
);
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = `mongodb+srv://${process.env.DB_ID}:${process.env.DB_PASS}@cluster0.p4xzv3m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
app.use(express.json());
async function run() {
  try {
    await client.db('admin').command({ ping: 1 });
    const productCollection = client.db('ShadhinMart').collection('products');

    app.get('/products', async (req, res) => {
      const page = parseInt(req.query.page) || 0;
      const size = parseInt(req.query.size) || 10;
      const search = req.query.search || '';
      const sort = req.query.sort || '';
      const minPrice = parseInt(req.query.minPrice) || 0;
      const maxPrice = parseInt(req.query.maxPrice) || Infinity;
      const brands = req.query.brands ? req.query.brands.split(',') : [];
      const categories = req.query.categories ? req.query.categories.split(',') : [];

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
      if (minPrice || maxPrice < Infinity) {
        query.price = { $gte: minPrice, $lte: maxPrice };
      }

      let options = {};
      if (sort === 'lth') {
        options.sort = { price: 1 };
      } else if (sort === 'htl') {
        options.sort = { price: -1 };
      } else if (sort === 'date') {
        options.sort = { createdAt: 1 };
      }

      const products = await productCollection
        .find(query, options)
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(products);
      app.get('/productcount', async (req, res) => {
        const search = req.query.search || '';
        const brands = req.query.brands ? req.query.brands.split(',') : [];
        const categories = req.query.categories ? req.query.categories.split(',') : [];
        const minPrice = parseInt(req.query.minPrice) || 0;
        const maxPrice = parseInt(req.query.maxPrice) || Infinity;
  
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
        if (minPrice || maxPrice < Infinity) {
          query.price = { $gte: minPrice, $lte: maxPrice };
        }
  
        const count = await productCollection.countDocuments(query);
        res.send({ count });
      });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

run();

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.listen(port, () => {
  console.log(`Server is running at port ${port}`);
});
