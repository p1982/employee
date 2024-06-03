// Необхідні модулі
const express = require("express")
// Axios отримує відповідь від зовнішнього API та зберігає її в собі 
const axios = require("axios")
//Завантажує змінні оточення з .env-файлу
require("dotenv").config()
// Моделі баз даних для MongoDB
const db = require('../models')
// Створює новий об'єкт router для керування маршрутами
const router = express.Router()
// Проміжне програмне забезпечення для перевірки автентичності працівника перед тим, як дозволити доступ до певних маршрутів
const isAuthenticated = require("../controllers/isAuthenticated")



// Застосувати проміжне ПЗ isAuthenticated до всіх маршрутів на цьому маршрутизаторі, щоб забезпечити доступ тільки для автентифікованих клієнтів
// Визначити маршрут для доступу до сторінки профілю
router.get("/", isAuthenticated, (req, res) => {
    // Знайти в базі даних поточного аутентифікованого клієнта за його ідентифікатором, збереженим у сесії
    db.Cart.find()
        .then(carts => {
            // Якщо клієнта знайдено, відрендерити сторінку профілю та передати шаблону дані клієнта та currentUser
            res.render("cart.ejs", {
                carts: carts,
                // Включаємо відображення персоналізованого контенту, передавши шаблону currentUser
                currentUser: req.session.currentUser
            })
        })
        .catch(err => res.status(500).json({ error: err.message }))
})


//Створити маршрут для створення нового працівника
router.post('/:id', isAuthenticated, async (req, res) => {
    const drug = await db.Drug.findOne({
        _id: { $ne: req.params.id }
    });
    const cart = await db.Cart.findOne({
        name: { $ne: drug.name }
    });
    
    if (!cart) {
        const newCart = {
            name: drug.name,
            price: drug.price,
            count: 1,
            img_url: drug.img_url,
        }
        console.log(newCart, 2222);
        // Зберегти нового працівника в базі даних
        await db.Cart.create(newCart)
    }

if(cart){
    const update = {
        name: drug.name,
        price: drug.price,
        count: cart.count+=1,
        img_url: drug.img_url,
    }
    await db.Drug.updateOne({ _id: cart._id }, { $set: update }, { new: true })
}


    // Перенаправлення після успішного створення працівника
    //res.redirect("/drugs")
})

//Створити маршрут для оновлення працівника
router.put('/:id', isAuthenticated, async (req, res) => {
    //пошук працівника в базі данних
    const drug = await db.Drug.find({
        _id: { $ne: req.params.id }
    });
    //Перевірка чи знайдений працівник
    if (!drug) {
        res.json({ status: 404, message: 'Drug not found' })
    }

    const updateDrug = {
        name: req.body.name,
        price: req.body.price,
        count: req.body.count,
        isAvailable: req.body.count ? true : false,
        img_url: req.body.img_url,
    }

    // Оновлення бази данних новими даними про працівника
    await db.Drug.updateOne({ _id: req.params.id }, { $set: updateDrug }, { new: true })

    // Перенаправлення після успішного створення працівника
    res.redirect("/drugs")
})


// DELETE - видалити певного клієнта, а потім перенаправити
router.delete("/:id", isAuthenticated, (req, res) => {
    // Знайти працівника за його ідентифікатором
    db.Drug.findById(req.params.id)
        .then((drug) => {
            // Перевірка наявності клієнта
            if (!drug) {
                // Обробка помилки, якщо клієнт не знайден
                return res.json({ status: 404, message: "Drug not found" })
            }
            // Видалення
            db.Drug.findByIdAndDelete(req.params.id)
                .then(() => {
                    // Перехід на сторінку всіх клієнтів
                    res.redirect("/drugs")
                })
                // Обробка бази данних
                .catch(error => {
                    res.status(500).send(error.message)
                })
        })
        // Обробка помилки сервера
        .catch(error => {
            res.status(500).send("something went wrong")
        })
})



/*  Експортуйте ці маршрути, щоб вони були доступні в `сервер.js`.
--------------------------------------------------------------- */
module.exports = router