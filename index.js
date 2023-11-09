const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 7000;

// middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ['https://restaurant-management-server-ochre.vercel.app'],
  credentials: true
}));

const uri = `mongodb+srv://${process.env.BD_USER}:${process.env.BD_PASSWORD}@cluster0.ymhbsfp.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const logger = async (req, res, next) => {
  console.log("called:", req.host, req.originalUrl);
  next();
};

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    await client.connect();

    const foodCollection = client.db("foodCollection").collection("foodItems");
    const bookingFood = client.db("foodCollection").collection("bookingFood");
    const userCollection = client.db("foodCollection").collection("user");

    app.post("/jwt", logger, async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });

    app.get("/foods",logger,verifyToken, async (req, res) => {
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
    app.post("/order", async (req, res) => {
      const order = req.body;
      const result = await bookingFood.insertOne(order);
      res.send(result);
    });

    // User Order
    app.get("/order", async (req, res) => {
      const cursor = bookingFood.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // Delete user Order
    app.delete("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingFood.deleteOne(query);
      res.send(result);
    });

    // Add By User

    app.post("/userAdd", async (req, res) => {
      const newProduct = req.body;
      console.log(newProduct);
      const result = await userCollection.insertOne(newProduct);
      res.send(result);
    });

    app.get("/userAdd", async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.put("/userAdd/:id", async (req, res) => {
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
      const result = await userCollection.updateOne(filter, product, option);
      res.send(result);
    });

    // user Activities
    app.get("/user", async (req, res) => {
      const cursor = userCollection.find();
      const users = await cursor.toArray();
      res.send(users);
    });

    app.post("/user", async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.patch("/user", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const updateDoc = {
        $set: {
          lastLoggedAt: user.lastLoggedAt,
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

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
