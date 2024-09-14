let mongoose = require('mongoose');

// mongoose.connect(`mongodb+srv://nikhil:123@backendlearning.f16cp.mongodb.net/`);
mongoose.connect(`mongodb+srv://nikhilsharma24:oz9KthwlB5ahQg2N@cluster0.txzrq.mongodb.net/`); 

const userschema = mongoose.Schema({
    email: String,
    username:String,
    password: String,
    printing_file:[ {type:mongoose.Schema.Types.ObjectId,
        ref:"ordermodel"
    }],
    
    

});

module.exports = mongoose.model('customer', userschema);