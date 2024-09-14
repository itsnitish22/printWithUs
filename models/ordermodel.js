const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    Name: String,
    Contact_Number: String,
    Email: String,
    Preferred_Time_Slot: String,
    Select_Service: String,
    Number_of_Copies: Number,
    Paper_Size: String,
    file: {
        _id: mongoose.Schema.Types.ObjectId,          // Store GridFS File ID
        filename: String,    // Store the filename for reference
        contentType: String  // Store the file MIME type
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'customer'
    },
    shopkeeper: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'shopkeeper'
    },
    cost:Number
});

module.exports = mongoose.model('Order', orderSchema);
