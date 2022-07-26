//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// 1. creating connection
mongoose.connect('mongodb+srv://admin-aman:test123@cluster0.nf7zk5v.mongodb.net/todolistDB');

// 2. create item schema
const itemSchema = {
  name: String
};

// 3. create mongoose model
const Item = mongoose.model("Item", itemSchema);

// 4. create mongoose document
const item1 = new Item({
  name: "Welcome to your todolist!"
});
const item2 = new Item({
  name: "Add and hit the + button to add task."
});
const item3 = new Item({
  name: "<-- Hit this to delete a task."
});

const defaultItems = [item1, item2, item3];
const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  // Mongoose find() to console
  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      // inseting default items
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("default items added..");
        }
        res.redirect("/");
      });
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
});

// work using express routes and params
app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({
    name: customListName
  }, function(err, results) {
    if (err) {
      console.log(err);
    } else {
      if (!results) {
        // create a new one
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        // show existing list
        res.render("list", {
          listTitle: results.name,
          newListItems: results.items
        });
      }
    }
  });

});
app.get("/about", function(req, res) {
  res.render("about");
});

app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (err) {
        console.log("Error while deleting!!");
      } else {
        console.log("Item deleted successfully..");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function(err, results) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});

let port = process.env.PORT;
if(port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server started on port 3000");
});
