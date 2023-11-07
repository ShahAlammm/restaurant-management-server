const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 7000;

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.BD_USER}:${process.env.BD_PASSWORD}@cluster0.ymhbsfp.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const foodCollection = client.db('foodCollection').collection('foodItems');
    const bookingFood = client.db('foodCollection').collection('bookingFood');


    app.get("/foods", async (req, res) => {
      const cursor = foodCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.findOne(query);
      res.send(result);
    });

// Order
  //   app.post('/order', async (req, res) => {
  //     const order = req.body;
  //     const result = await bookingFood.insertOne(order);
  //     res.send(result);
  // });

  app.post("/foods", async (req, res) => {
    const newProduct = req.body;
    console.log(newProduct);
    const result = await foodCollection.insertOne(newProduct);
    res.send(result);
  });

  app.put("/foods/:id", async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const option = { upsert: true };
    const updateProduct = req.body;
    const product = {
      $set: {
        FoodName: updateProduct.FoodName,
        brandName: updateProduct.brandName,
        FoodCategory: updateProduct.FoodCategory,
        Price: updateProduct.Price,
        FoodDetails: updateProduct.FoodDetails,
        FoodImage: updateProduct.FoodImage,
        FoodOrigin: updateProduct.FoodOrigin,
      },
    };
    const result = await foodCollection.updateOne(filter, product, option);
    res.send(result);
  });


  // app.get("/", async (req, res) => {
  //     const page = parseInt(req.query.page) || 1; // Get the page number from the query parameters
  //     const pageSize = 9; // Number of items per page

  //     try {
  //       const foods = await Food.find()
  //         .skip((page - 1) * pageSize)
  //         .limit(pageSize);

  //       res.json(foods);
  //     } catch (error) {
  //       console.error("Error fetching food items:", error);
  //       res.status(500).json({ error: "Internal Server Error" });
  //     }
  //   });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Restaurant server is running");
});

app.listen(port, () => {
  console.log(`Restaurant server is running on port ${port}`);
});
