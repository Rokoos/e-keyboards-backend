const express = require('express')
const router = express.Router()

const {
    authCheck,
} = require('../middlewares/auth')

const {
    userCart,
    getUserCart,
    emptyCart,
    saveAddress,
    createOrder,
    getOrders,
    addToWishlist,
    wishlist,
    removeFromWishlist
} = require('../controllers/user')


router.post('/user/cart',authCheck, userCart) //save cart
router.get('/user/cart', authCheck, getUserCart) //get cart
router.delete('/user/cart', authCheck, emptyCart) //delete
router.post('/user/address', authCheck, saveAddress) //save user's address

router.post('/user/order', authCheck, createOrder)
router.get('/user/orders', authCheck, getOrders)

//wishlist

router.post('/user/wishlist', authCheck, addToWishlist)
router.get('/user/wishlist', authCheck, wishlist)
router.put('/user/wishlist/:productId', authCheck, removeFromWishlist)

module.exports = router