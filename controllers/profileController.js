// Імпортуємо необхідні модулі: express для маршрутизації, підключення до бази даних, bcrypt для хешування паролів та проміжний модуль isAuthenticated
const router = require('express').Router()
const db = require('../models')

// Проміжне програмне забезпечення для перевірки автентичності працівника перед тим, як дозволити доступ до певних маршрутів
const isAuthenticated = require("../controllers/isAuthenticated")
// Застосувати проміжне ПЗ isAuthenticated до всіх маршрутів на цьому маршрутизаторі, щоб забезпечити доступ тільки для автентифікованих співробітників
// Визначити маршрут для доступу до сторінки профілю
router.get("/", isAuthenticated, (req, res) => {
    // Знайти в базі даних поточного аутентифікованого співробітника за його ідентифікатором, збереженим у сесії
    db.Employee.findById({ _id: req.session.currentUser._id })
        .then(employee => {
            console.log(employee);
            // Якщо співробітника знайдено, відрендерити сторінку профілю та передати шаблону дані співробітника та currentUser
            res.render("profile.ejs", {
                employee: employee,
                // Включаємо відображення персоналізованого контенту, передавши шаблону currentUser
                currentUser: req.session.currentUser
            })
        })
        .catch(err => res.status(500).json({ error: err.message }))
})


module.exports = router