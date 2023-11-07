// @ts-nocheck
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zdityrz.mongodb.net/?retryWrites=true&w=majority`;

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
    // database&collection
    const usersCollection = client.db("TasteHarmonyCafeDB").collection("users");
    const foodsCollection = client.db("TasteHarmonyCafeDB").collection("foods");
    const ordersCollection = client
      .db("TasteHarmonyCafeDB")
      .collection("orders");

    // post method for users
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
    });

    // post method for addFoodItem
    app.post("/addFood", async (req, res) => {
      const newFoodItem = req?.body;
      const queryFoodName = newFoodItem?.foodName;
      const existingFoodItem = await foodsCollection.findOne({
        foodName: queryFoodName,
      });

      if (existingFoodItem) {
        return res.send({ message: "Already Exists" });
      } else {
        const result = await foodsCollection.insertOne(newFoodItem);
        res.send({ message: "Added", ...result });
      }
    });

    app.get("/fooditems", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const foodItems = await foodsCollection
        .find()
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(foodItems);
    });
    app.get("/foodItemsCount", async (req, res) => {
      const count = await foodsCollection.estimatedDocumentCount();
      res.send({ count });
    });

    // orderpost
    app.post("/orderItems", async (req, res) => {
      const orderItems = req.body;
      const queryFoodName = orderItems?.foodName;
      const existingFoodItem = await foodsCollection.findOne({
        foodName: queryFoodName,
      });
      if (existingFoodItem.quantity === 0) {
        return res.send({
          message: "This Food Item is not Available right now.",
        });
      } else if (existingFoodItem.quantity < orderItems.quantity) {
        return res.send({
          message: "Execced Quantity, Please Select Less",
        });
      } else {
        const result = await ordersCollection.insertOne(orderItems);
        res.send(result);
      }
    });

    app.put("/orderItem", async (req, res) => {
      const foodItem = req.body;
      const filter = { foodName: foodItem.foodName };
      const orderQuantity = parseInt(foodItem.quantity);
      const queryFoodName = foodItem?.foodName;
      const existingFoodItem = await foodsCollection.findOne({
        foodName: queryFoodName,
      });
      const availableQuantity = existingFoodItem.quantity;
      if (availableQuantity >= orderQuantity) {
        const restQuantity = availableQuantity - orderQuantity;
        const count = existingFoodItem.count;
        const presentCount = orderQuantity + count;
        const food = {
          $set: {
            quantity: restQuantity,
            count: presentCount,
          },
        };
        const result = await foodsCollection.updateOne(filter, food);
        res.send(result);
      } else {
        return res.send({
          message: "This Food Item is not Available right now.",
        });
      }
    });

    // get method for purchase food item page
    app.get("/foodItem/:foodName", async (req, res) => {
      const foodName = req.params.foodName;
      const query = { foodName: foodName };
      const result = await foodsCollection.findOne(query);
      res.send(result);
    });

    // get orders method user specific
    app.get("/user/orders", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await ordersCollection.find().toArray();
      res.send(result);
    });

    // food added by user
    app.get("/user/addedfooditems", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { userEmail: req.query.email };
      }
      const result = await foodsCollection.find(query).toArray();
      res.send(result);
    });

    // get method for top 6 food items
    app.get("/topfooditems", async (req, res) => {
      const result = await foodsCollection
        .find({ count: { $gt: 0 } })
        .sort({ count: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    // food item delete method
    app.delete("/user/delete-foodItem/:orderId", async (req, res) => {
      const id = req.params.orderId;
      const query = { _id: new ObjectId(id) };
      const result = await ordersCollection.deleteOne(query);
      res.send(result);
    });

    // get method for update foodItem
    app.get("user/addedFoodItems/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.findOne(query);
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// testing
app.get("/", (req, res) => {
  res.send("Cafe is Runnig");
});

app.listen(port, () => {
  console.log(`Cafe is running on port ${port}`);
});
