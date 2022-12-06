const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require("lodash");
const app = express();
const port = 3000;

// create database
// connect mongoose
mongoose.connect('mongodb+srv://admin-umtcmrcn:hfi468AXC@cluster0.obcjmxy.mongodb.net/todolistDB');

const itemsSchema = new mongoose.Schema ( {
  name: String,
});

const Item = mongoose.model('Item', itemsSchema);

// create data
const item1 = new Item({
  name: "Welcome to your todolist!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema ({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model('List', listSchema);

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// GET
app.get('/', (req, res) => {

  Item.find({}, (err, foundItems) => {

    if (foundItems.length === 0) {
      // insert default items
      Item.insertMany( defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today",
                          newListItem: foundItems});
    }
  });
})

app.get('/:customListName', (req, res) => {

  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        // Show an existing list
        res.render("list", {listTitle: foundList.name, newListItem: foundList.items});
      }
    }
  });
});

app.get('/about', (req, res) => {

  res.render('about');

})

// POST
app.post('/', (req,res) => {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if (listName === "Today") {
    newItem.save();
    res.redirect('/');
  } else {
    List.findOne({name: listName}, (err, foundList) => {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect('/'+ listName);
    })
  }


});

app.post('/delete', (req, res) => {

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate( {name: listName},
       {$pull: {items: {_id: checkedItemId}}},
       (err, foundList) => {
        if (!err) {
          res.redirect("/" + listName);
        } else {
          console.log(err);
        };
    });
  };
});

// LISTEN
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
