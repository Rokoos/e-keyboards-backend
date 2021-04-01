const express = require('express')
const router = express.Router()

//middleware
const {
    authCheck,
    adminCheck
} = require('../middlewares/auth')

//controller
const {
    create,
    read,
    update,
    remove,
    list
} = require('../controllers/category')

const {productsCountByCategory} = require("../controllers/product")

//routes

router.post('/category', authCheck, adminCheck, create )
router.get('/categories', list )
router.get('/category/total/:slug', productsCountByCategory )
router.post('/category/:slug', read )
router.put('/category/:slug', authCheck, adminCheck, update )
router.delete('/category/:slug', authCheck, adminCheck, remove )


module.exports = router