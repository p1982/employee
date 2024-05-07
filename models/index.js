// Завантажити змінні оточення з файлу .env
require("dotenv").config()
// Імпортуємо mongoose для взаємодії з MongoDB
const mongoose = require("mongoose")
// Імпортуємо axios для створення HTTP-запитів
const axios = require("axios")
// Отримати URI з'єднання з MongoDB зі змінних оточення
const MONGODBURI = process.env.URI
// Підключення до MongoDB 
mongoose.connect(MONGODBURI)
const db = mongoose.connection

// Обробник події успішного з'єднання з MongoDB
db.on("connected", function () {
    console.log(`Connected to MongoDB @{db.name} at ${db.host}: $db.port`)
})
// Експортуємо моделі та вихідні дані для використання в інших частинах додатку Room-Booker
module.exports = {
    Clients: require("./Clients"),
    Admin: require("./Admin"),
    Drug: require("./Drug"),
}