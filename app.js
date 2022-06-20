/*
  Module dependencies.
*/
require('dotenv').config()
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose')
const hash = require('pbkdf2-password')()
const session = require('express-session')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

var app = express();


/*
  Models
*/
const User = require('./models/User')


/*
  Routers
*/
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

app.use('/', indexRouter);
app.use('/users', usersRouter);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Private Route
app.get('/user/:id', async (req, res) => {
  const id = req.params.id

  // check if user exists
  const user = await User.findById(id, '-password')

  if (!user) {
    return res.send('Usuário não encontrado!')
  }

  res.render('user', {title: 'Painel do Usuário', user})
})

/*
function checkToken (req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if(!token) {
    return res.send('Acesso negado!')
  }

  try {
    const secret = process.env.SECRET
    jwt.verify(token, secret)
    next()
  } catch (error) {
    res.send('Token inválido!')
  }
}
*/

// Register User
app.get('/auth/register', (req,res,next) => {
  res.render('register', {title: 'Register', pclass:'', msg: ''})
})

app.post('/auth/register', async(req, res) => {
  const { username, email, password, confirmPassword } = req.body

  // validations
  if (!username) {
    var txt = 'Um nome de usuário é obrigatório!'
    return res.render('register', {title: 'Register', pclass:'error', msg: txt})
  }

  if (!email) {
    var txt = 'Um endereço de e-mail é obrigatório!'
    return res.render('register', {title: 'Register', pclass:'error', msg: txt})
  }
  
  if (!password) {
    var txt = 'Uma senha é obrigatória!'
    return res.render('register', {title: 'Register', pclass:'error', msg: txt})
  }
  
  if (password !== confirmPassword) {
    var txt = 'As senhas não conferem!'
    return res.render('register', {title: 'Register', pclass:'error', msg: txt})
  }

  // check if user exists
  const userExists = await User.findOne({username: username})
  const emailExists = await User.findOne({email: email})

  if (emailExists) {
    let txt = 'E-mail já cadastrado no sistema!'
    return res.render('register', {title: 'Register', pclass:'error', msg: txt})
  } else if (userExists) {
    let txt = 'Nome já está sendo usuado por outro usuário!'
    return res.render('register', {title: 'Register', pclass:'error', msg: txt})
  }

  // create password
  const salt = await bcrypt.genSalt(12)
  const hash = await bcrypt.hash(password, salt)

  // create user
  const user = new User({
    username,
    email,
    password: hash
  })

  try {
    await user.save()

    let txt = 'Usuário criado com sucesso!'
    res.render('register', {title: 'Register', pclass: 'success', msg: txt})
  } catch (error) {
    console.log(error)
    res.send('Ocorreu um erro no servidor, tente novamente mais tarde!')
  }
})


// Login User
app.get('/auth/login', (req,res,next) => {
  res.render('login', {title: 'Login', pclass:'', msg: ''})
})

app.post('/auth/login', async(req,res,next) => {
  const { user, password } = req.body

  if (!user) {
    var txt = 'Um usuário é obrigatório!'
    return res.render('login', {title: 'Login', pclass:'error', msg: txt})
  }
  
  if (!password) {
    var txt = 'Uma senha é obrigatória!'
    return res.render('login', {title: 'Register', pclass:'error', msg: txt})
  }

  // check if user exists
  const username = await User.findOne({username: user})

  if (!username) {
    let txt = 'Usuário não encontrado!'
    return res.render('login', {title: 'Login', pclass: 'error', msg: txt})
  }
  
  // check if password match
  checkPassword = await bcrypt.compare(password, username.password)

  if (!checkPassword) {
    let txt = 'Senha inválida!'
    return res.render('login', {title: 'Login', pclass: 'error', msg: txt})
  }
  
  try {
    const secret = process.env.SECRET

    const token = jwt.sign({
      id: username._id
    }, secret,)

    let txt = 'Autenticação realizada com sucesso!'
    res.redirect('/user/'+username._id, {token})
  } catch (error) {
    console.log(error)
    res.send('Ocorreu um erro no servidor, tente novamente mais tarde!')
  }
})


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};


  // render the error page
  res.status(err.status || 500);
  res.render('error', {title: 'Error Page'});
});

module.exports = app;


// Connect MongoDb Atlas
dbUser     = process.env.DB_USER
dbPassword = process.env.DB_PASSWORD
dbCluster  = process.env.CLUSTER_NAME

mongoose.connect(
  `mongodb+srv://${dbUser}:${dbPassword}@${dbCluster}.fw0pm.mongodb.net/?retryWrites=true&w=majority`
).then(
  console.log('Conectado corretamente ao MongoDb Atlas...')
).catch((err)=>{console.log(err)})