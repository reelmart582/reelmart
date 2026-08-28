const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
{
    name:{
        type:String,
        required:true,
        trim:true
    },

    description:{
        type:String,
        required:true
    },

    price:{
        type:Number,
        required:true
    },

    category:{
        type:String,
        required:true
    },

    stock:{
        type:Number,
        default:0
    },

    image:{
        type:String,
        default:""
    },

    reelVideo:{
        type:String,
        default:""
    },

    // Optional product-specific information. Example:
    // { "Storage": "256GB", "Material": "Leather", "Battery": "5000mAh" }
    attributes:{
        type:Map,
        of:String,
        default:{}
    },

    // Optional selectable variants. Example:
    // [{ label:"Storage", options:["128GB","256GB","512GB"] }]
    variants:[{
        label:{type:String,trim:true},
        options:[{type:String,trim:true}]
    }],

    seller:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    default:null
}

},
{
    timestamps:true
});

module.exports = mongoose.model("Product",productSchema);