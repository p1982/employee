//Імпорт експресс бібліотеки
const express = require('express')
//Створня сесії
const session = require('express-session')
//Імпорт біблотеку для запитів
const axios = require('axios')
//Імпорт контролерів для сессії та робітників
const sessionCtrl = require('./controllers/sessionController.js')
const drugCtrl = require('./controllers/drugController.js')
const clientsCtrl = require('./controllers/clientsController.js')
const adminCtrl = require('./controllers/adminController.js')
const profileCtrl = require("./controllers/profileController.js")

//Ініціалізація бібліотекі змінних середовища
require("dotenv").config()
//Бібліотека для роботи зі статичними файлами та папками
const path = require("path")

//Можливість використання методів PUT and DELETE
const methodOverride = require("method-override")

//Онлайн перезавантаження сторінок
const livereload = require("livereload")
const connectLiveReload = require("connect-livereload")

//мідлвейр для HTTP запиту
const morgan = require("morgan")

//Підключення моделі та сід(посів) данних
const db = require("./models")

//Створення застосунку
const app = express()

//створення секретної сессії із ідентифікатором в кукі
app.use(
    session({
        secret: process.env.SECRET_KEY,//Secret used to sign the session ID cookie
        resave: false,
        saveUninitialized: false
    })
)

//Онлайн перезавантаження сторінок - при зміннах кодах через 0,1 секунду
const liveReloadServer = livereload.createServer()
liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
        liveReloadServer.refresh("/")
    }, 100)
})
/*Налаштівання застосунку (app.set)
--------------------------------------------------------------- */
//Шлях до сторінок есджс - ті що покузуються на єкрані
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

//Використання статичних сторінок
app.use(express.static("public"))
app.use(connectLiveReload())
// Змінна метода POST запиту з броузерного як інших запитів типу: DELETE, PUT, etc.
app.use(methodOverride("_method"))
//Налаштування формату передачі данних 
app.use(express.json()) //this creates an empty object { } , before that it’s a str, undefined
///Body parser: used for POST/PUT/PATCH (create, update) routes that allows to use req.body to get form data
// this will take incoming strings from the body that are URL encoded and parse them 
// into an object that can be accessed in the request parameter as a property called body (req.body).
app.use(express.urlencoded({ extended: true }))

//налаштування роутинга для застосунку
app.use(morgan("tiny"))
app.use("/session", sessionCtrl)
app.use("/drugs", drugCtrl)
app.use("/clients", clientsCtrl)
app.use("/admins", adminCtrl)
app.use("/profile", profileCtrl)
adminCtrl
// Домашня роут для рендера домашньї сторінки
app.get("/", (req, res) => {
  res.render("home.ejs", { currentUser: null })
})


/* Запуск сервера на порту зі змінних оточення
--------------------------------------------------------------- */
app.listen(process.env.PORT, function () {
  console.log('Express is listening to port', process.env.PORT)
})