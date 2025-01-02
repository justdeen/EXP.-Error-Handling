const express = require('express')
const app = express()
const path = require('path')
const mongoose = require('mongoose')
const Product = require('./models/product')
const methodOverride = require('method-override')
const AppError = require('./AppError')

const categories = ['fruit', 'vegetable', 'dairy']

mongoose.connect('mongodb://127.0.0.1:27017/farmstand2')
.then(() => {
    console.log('CONNECTION OPEN')
})
.catch(err => {
    console.log('CONNECTION ERROR')
    console.log(err)
})

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(express.urlencoded({extended: true}))
app.use(methodOverride('_method'))

app.get('/products',  wrapAsync(async (req, res) => {
    const {category} = req.query
    if(category){
        const products = await Product.find({category})
        res.render('products/index', {products, category})
    }else{
        const products = await Product.find({})
        res.render('products/index', {products, category: 'All'})
    }
}))

app.get('/products/new', (req, res) => {
    res.render('products/new', {categories})
})

function wrapAsync(fn){  // 'fn' is equal to each of the async functions in each API routes
    return function(req, res, next){    //  Callback function which catches the 'req' from the user
        fn(req, res, next).catch(e => next(e))   // 'fn' function is then called, having req, res and next as the arguments  
    }
}

app.get('/products/:id', wrapAsync(async (req, res, next) => {
    const {id} = req.params
    const product = await Product.findById(id)
    res.render('products/show', {product})
}))

app.get('/products/:id/edit', wrapAsync(async (req, res) => {
    const {id} = req.params
    const product = await Product.findById(id)
    res.render('products/edit', {product, categories}) 
}))

app.post('/products', wrapAsync(async (req, res) => {
    const newProduct = new Product(req.body)
    await newProduct.save()
    res.redirect(`/products/${newProduct._id}`)
}))

app.put('/products/:id', wrapAsync(async (req, res) => {
    const {id} = req.params
    const product = await Product.findByIdAndUpdate(id, req.body, {runValidators: true, new: true})
    res.redirect(`/products/${product._id}`)
}))

app.delete('/products/:id',  wrapAsync(async (req, res) => {
    const {id} = req.params
    const deletedProduct = await Product.findByIdAndDelete(id)
    res.redirect('/products')
}))

const handleValidationErr = err => {
    console.dir(err);
    return new AppError(`Validation failed...${err.message}`, 400);
}

const handleCastError = err => {
    return new AppError(`Query failed...${err.message}`, 404);
}

app.use((err, req, res, next) => {
    console.log(err.name)
    if(err.name === 'ValidationError') err = handleValidationErr(err)
    else if(err.name === 'CastError') err = handleCastError(err)
    next(err)
})

app.use((err, req, res, next) => {
    const {status = 500, message = 'Something went wrong'} = err;
    res.status(status).send(message)
})

app.listen(3000, () => {
    console.log('LISTENING ON PORT 3000!')
})