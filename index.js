// @ts-nocheck
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
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

    // post method for users
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
    });

    // post method for addFoodItem
    // foodCollection.createIndex({ foodName: 1 }, { unique: true });
    // app.post("/addItem", async (req, res) => {
    //   const newFoodItem = req.body;
    //   const queryFoodName = newFoodItem.foodName;
    //   const existingFoodItem = await foodsCollection.findOne({
    //     foodName: queryFoodName,
    //   });
    //   const result = await foodsCollection.insertOne(newFoodItem);
    //   res.send(result);

    //   if (existingFoodItem) {
    //     return res.status(200).json({ message: "Food item already exists" });
    //   } else {
    //     if (result.insertedCount === 1) {
    //       res.send(result);
    //       return res
    //         .status(201)
    //         .json({ message: "Food item added successfully" });
    //     } else {
    //       return res
    //         .status(500)
    //         .json({ message: "An error occurred while adding the food item" });
    //     }
    //   }
    // });

    app.post("/addItem", async (req, res) => {
      const newitem = req?.body;
      const queryFoodName = newitem?.foodName;
      const existingFoodItem = await foodsCollection.findOne({
        foodName: queryFoodName,
      });

      if (existingFoodItem) {
        return res.send({ message: "Already Exists" });
      } else {
        const result = foodsCollection.insertOne(newitem);
        res.send({ message: "Added" });
      }
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
