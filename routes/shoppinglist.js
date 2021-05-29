var db = require('./db');
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose')
const { Int32, ObjectId, ObjectID, Timestamp } = require('mongodb');
const session = require('express-session');

/* Schema */
var productSchema = mongoose.Schema({
title: String,
content: String,
username: String,
familyID: ObjectID,
familyname: String,
bought: Boolean,
familyID: ObjectID
});
const product = mongoose.model('Entrie', productSchema) // TODO: Change this later to Product instead of Entrie. Make entries collection obsolete


/*
Usage:
Title, content, username, familyID(ObjectID of family)
*/
router.post('/add', function (req, res) {

    function addProduct(data, callback) {
        var newdata = new product({
            title: data.title,
            content: data.content,
            username: req.session.username,
            bought: false,
            familyID: data.familyid,
            familyname: data.familyname
        });
        newdata.save(function (err, result) {
            if (err) {
                console.log(err);
                callback(err);
            } else {
                callback(result);
            }
        });
    }

    addProduct(req.body, function (response) {
        res.send(response);
    });
}),


// Send familyID(ObjectID of family)
router.get('/', function (req, res) { // Gets all products where familyID = yours

    // Other users may join this family registering with the familycode 
    //var randomcode = req.session.family.substring(8, 13); // TODO: Must be defined or else 500 error

    function getAllProducts(callback) {
        try {
            //var familyid = req.params.id; // If ID is in url
            //var familyid = req.body.familyID; // In POST-data
            var familyid = req.session.family; // ID in session variable
            console.log(req.session.family);



            product.find({ familyID: {$in: familyid} }, function (err, res) {
                if (err) {
                    console.log(err);
                    callback(err);
                } else {
                    //console.log("returning " + res);
                    callback(res);
                }
            });
        } catch (error) {
            console.log(error);
        }
    }

    /*
    console.log("The following is req.session:");
    console.log(req.session);
    console.log(req.session.family);*/
    console.log("Req session: " + req.session.family);
    

    if (req.session.family) {
        getAllProducts(function (response) {
            res.json(response);
        })
    } else {
        res.json("You're not logged in!")
    }
});


/*
Usage:
Send objectid of product as "productOID" (ObjectID)
Send status of checkmark as "bought" (boolean)
Send any changes to be made such as bought, title or content
*/
router.post('/edit', function (req, res) {
    var familyid = req.session.family; // familyid of current session

    function editProduct(data, callback) {
        //var bought = (data.bought === "true"); // Convert string input to bool
        var bought = data.bought;

        product.findByIdAndUpdate(data.productOID, // Find product by objectID
            {bought: bought, title: data.title, content: data.content}, // The data to edit
            {omitUndefined: true}, // Example; if title isn't set, don't send any title data. If this is false, it will replace title with null in the case if no data is sent.
                function (err, options) {
                    if (err) {
                        console.log(err);
                        callback(err);
                    } else {
                        console.log("Set product bought status to: " + bought);
                        callback("Set product bought status to: " + bought);
                    }
            });
    }
    editProduct(req.body, function (response) {
        res.send(response);
    });
}),



/*
Usage:
Send objectid of product as "productOID" (ObjectID)

TODO: Test
*/
router.delete('/delete/:id', function (req, res) {

    function deleteProduct(data, callback) {
        product.findByIdAndDelete(data.id, function (err, res) {
            if (err) {
                console.log(err);
                callback(err);
            } else {
                console.log("Deleted product! " + data.id);
                callback(res);
            }
        });
    }
    deleteProduct(req.params, function (response) {
        res.send(response);
    });
});

/*
Usage: Check if familyID of session corresponds with product the user is changing
This is an extra security measure, as otherwise you could delete another family's products if you have an ObjectID from their list using the REST-API.

Takes the whole request parameter, returns true if allowed and false if not
*/
function checkPrivilige(req) {
    product.findById(req.body.productOID, function (err, result) {
        if (err) {
            console.log(err);
            callback(false);
        } else {

            if (result.familyID == req.session.family) { // User has rights for this action
                callback(true);
            } else { // User is not allowed
                callback(false);
            }

        }
    });
}

module.exports = router;