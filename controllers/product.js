const Product = require('../models/product')
const User = require('../models/user')
const slugify = require('slugify')

exports.create = async (req, res) => {
    try {
        req.body.slug = slugify(req.body.title)
        res.json(await new Product(req.body).save())
    } catch (error) {
        console.log(error)
        res.status(400).json({
            error: error.message
        })
    }
}

exports.listAll = async (req, res) => {
    let products = await Product.find({})
    .limit(parseInt(req.params.count))
    .populate('category')
    .populate('subs')
    .sort([['createdAt', 'desc']])
    .exec()
    res.json(products)
}

exports.remove = async (req, res) => {
    try {
        const deleted = await Product.findOneAndRemove({slug: req.params.slug}).exec()
        res.json(deleted)
    } catch (error) {
        console.log(err)
        res.status(400).send('Product delete failed')
    }
}
exports.read = async (req, res) => {
    const product = await Product.findOne({slug:req.params.slug})
    .populate('category')
    .populate('subs')
    .exec()
    res.json(product)
}



exports.update = async (req, res) => {
    try {
        if(req.body.title){
            req.body.slug = slugify(req.body.title)
        }
        const updated = await Product.findOneAndUpdate(
            {slug: req.params.slug},
             req.body, 
             {new: true}).exec()
        res.json(updated)     
    } catch (error) {
        console.log(error)
        res.status(400).json({
            error: error.message
        })
    }
}


//list with pagination
exports.list = async (req, res) => {
    try {
        const {sort, order, page} = req.body
        const currentPage = page || 1
        const perPage = 3
        
        const products = await Product.find({})
        .skip((currentPage -1) * perPage)
        .populate('category')
        .populate('subs')
        .sort([[sort, order]])
        .limit(perPage)
        .exec()

        res.json(products)
    } catch (error) {
        console.log(error)
        res.status(400).json({
            error: error.message
        })
    }
}

exports.productsCount = async (req, res) => {
    let total = await Product.find({})
    .estimatedDocumentCount()
    .exec()
    res.json(total)
}

exports.productsCountByCategory = async (req, res) => {
    
    let total = await Product.find({})
    .populate('category')
    .exec()
    res.json(total)
}



exports.productStar = async (req, res) => {

    const product = await Product.findById(req.params.productId).exec()

    const user = await User.findOne({email: req.user.email}).exec()
    
    const {star} = req.body
   
    //check if logged in user has already added rating to this product
    let existingRatingObject = product.ratings.find(el => el.postedBy.toString() === user._id.toString())

    //if user hasn't left rating, push it
    if(existingRatingObject === undefined){
        let ratingAdded = await Product.findByIdAndUpdate(product._id, {
            $push: {ratings: {star, postedBy: user._id}}
        },
        {new: true})
        .exec()  

        res.json(ratingAdded)
    }else{
        //if user left rating update it
        let ratingUpdated = await Product.updateOne(
            {ratings: {$elemMatch: existingRatingObject}},
            {$set: {"ratings.$.star": star}},
            {new: true}
        ).exec()
       
        res.json(ratingUpdated)
    }

}

exports.setAverageRating = async(req, res) => {
    const product = await Product.findById(req.params.productId).exec()

    if(product){
        let ratingsArray =  product.ratings
        let total = []
        length = ratingsArray.length
        ratingsArray.map(rating => total.push(rating.star))
        let totalReduced = total.reduce((prev, next) => prev + next, 0)

    let updatedProduct = await Product.findByIdAndUpdate(product._id, {
        averageRating: totalReduced / length
    },
    {new: true})
    .exec()  

    
    res.json(updatedProduct)
    } 

} 







exports.listRelated = async(req, res) => {
    const product = await Product.findById(req.params.productId)
    .exec()

    const related = await Product.find({
        _id: {$ne: product._id},
        category: product.category
    })
    .limit(3)
    .populate('category')
    .populate('postedBy')
    .exec()

    res.json(related)
}







