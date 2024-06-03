// Імпортуємо необхідні модулі: express для маршрутизації, підключення до бази даних, bcrypt для хешування паролів та проміжний модуль isAuthenticated
const router = require('express').Router()
const db = require('../models')

// Проміжне програмне забезпечення для перевірки автентичності працівника перед тим, як дозволити доступ до певних маршрутів
const isAuthenticated = require("../controllers/isAuthenticated")
// Застосувати проміжне ПЗ isAuthenticated до всіх маршрутів на цьому маршрутизаторі, щоб забезпечити доступ тільки для автентифікованих клієнтів
// Визначити маршрут для доступу до сторінки профілю
router.get("/", isAuthenticated, async (req, res) => {
    // Знайти в базі даних поточного аутентифікованого клієнта за його ідентифікатором, збереженим у сесії
    db.Clients.findById({ _id: req.session.currentUser._id })
        .then(client => {
            if(!client){
                db.Admin.findById({ _id: req.session.currentUser._id })
                .then(admin => {
                    // Якщо клієнта знайдено, відрендерити сторінку профілю та передати шаблону дані клієнта та currentUser
                    res.render("profile.ejs", {
                        client: admin,
                        // Включаємо відображення персоналізованого контенту, передавши шаблону currentUser
                        currentUser: req.session.currentUser
                    })
                })
            } else{
                res.render("profile.ejs", {
                    client: client,
                    // Включаємо відображення персоналізованого контенту, передавши шаблону currentUser
                    currentUser: req.session.currentUser
                })
            }
            
        })
        .catch(err => res.status(500).json({ error: err.message }))
})


module.exports = router