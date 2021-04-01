const User = require('../models/user')
const Product = require('../models/product')
const Cart = require('../models/cart')
const Order = require('../models/order')
const { json } = require('body-parser')

exports.userCart = async(req, res) => {
    const {cart} = req.body

    let products = []
    const user = await User.findOne({email: req.user.email}).exec()

    //check if cart with logged user id alreaddy exists

    let cartExistsByUser = await Cart.findOne({orderedBy: user._id})

    if(cartExistsByUser){
        cartExistsByUser.remove()
        console.log('removed old cart')
    }

    for(let i = 0; i < cart.length; i++){
        let object = {}
        object.product = cart[i]._id
        object.count = cart[i].count

        //get  price of given product from db
        let productFromDB = await Product.findById(cart[i]._id).select('price').exec()
        object.price = productFromDB.price
        products.push(object)
    }


    let cartTotal = products.reduce((currentValue, nextValue) => currentValue + nextValue.count * nextValue.price , 0)


    let newCart = await new Cart({
        products,
        cartTotal,
        orderedBy: user._id
    }).save()


    res.json({ok: true})
}

exports.getUserCart = async (req, res) => {
    const user = await User.findOne({email: req.user.email}).exec()

    const cart = await Cart.findOne({orderedBy: user._id})
    .populate("products.product", "_id title price brand")
    .exec()

    const {products, cartTotal} = cart
    res.json({
        products, cartTotal
    })
}

exports.emptyCart = async (req, res) => {
    const user = await User.findOne({email: req.user.email}).exec()
    const cart = await Cart.findOneAndRemove({orderedBy: user._id}).exec()

    res.json(cart)
}

exports.saveAddress = async (req, res) => {
    const userAddress = await User.findOneAndUpdate(
        {email: req.user.email}, 
        {address: req.body.address})
        .exec()
        res.json({ok: true})
}

exports.createOrder = async (req, res) => {
    const {paymentIntent} = req.body.stripeResponse

    const user = await User.findOne({email: req.user.email}).exec()

    let {products} = await Cart.findOne({orderedBy: user._id}).exec()

    let newOrder = await new Order({
        products,
        paymentIntent,
        orderedBy: user._id
    }).save()

    //decrement quantity & increment solds
    let bulkOption = products.map(item => {
        return{
            updateOne:{
                filter: {_id: item.product._id}, //important!! item.product
                update: {$inc: {quantity: -item.count, sold: +item.count}}
            }
        }
    })

    let updated = await Product.bulkWrite(bulkOption, {})

    console.log('quantity--, sold ++', updated)

    console.log('new order saved', newOrder)
    res.json({ok: true})
}

exports.getOrders = async (req, res) => {
    let user = await User.findOne({email: req.user.email}).exec()

    let userOrders = await Order.find({orderedBy: user._id})
    .populate('products.product')
    .sort("-createdAt")
    .exec()

    res.json(userOrders)
}

exports.addToWishlist = async(req, res) => {
    const {productId} = req.body
    const user = await User.findOneAndUpdate(
        {email: req.user.email}, 
        {$addToSet: {wishlist: productId}})
        .exec()

        res.json({ok: true})
    
}

exports.wishlist = async(req, res) => {
    const list = await User.findOne({email: req.user.email})
    .select('wishlist')
    .populate('wishlist')
    .exec()

    res.json(list)
}

exports.removeFromWishlist = async (req, res) => {
    const {productId} = req.params

    const user = await User.findOneAndUpdate(
        {email: req.user.email},
        {$pull: {wishlist: productId}})
        .exec()

        res.json({ok: true})
    
}