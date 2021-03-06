//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", { useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true });

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);


const item1 = new Item({
    name: "Stay positive!"
})

const item2 = new Item({
    name: "Be confident"
})

const item3 = new Item({
    name: "Work hard!"
})

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);






app.get("/", function(req, res) {

    Item.find({}, function(err, foundItems) {
        if (foundItems.length === 0) {

            Item.insertMany(defaultItems, function(error, docs) {
                if (error) {
                    console.log(error);
                } else {
                    console.log("good job!");
                }
            });
            res.redirect('/');
        } else {
            res.render("list", { listTitle: "Today", newListItems: foundItems });
        }
    });

});

app.get('/:customListName', function(req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName }, function(err, foundList) {
        if (!err) {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);

            } else {
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
            }
        }
    })


});

app.post("/", function(req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    })

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, function(err, foundList) {
            foundList.items.push(item);
            foundList.save(); ///update foundList
            res.redirect("/" + listName);

        });
    }



});


app.post("/delete", function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function(err) {
            if (!err) {
                console.log("Successfully deleted checked item.");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function(err, foundList) {
            if (!err) {
                res.redirect("/" + listName);
            } ///item array에 있는 item하나만 찾아서 지우는거니까 pull기능 찾아서 써야됨. findByIdAndRemove로는 해당 schema를 지우니까
        });
    }
});


app.listen(3000, function() {
    console.log("The App is running in 3000 ")
})