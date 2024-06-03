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

// // НОВИЙ - показати форму для створення нових клієнтів
router.get("/new", isAuthenticated, (req, res) => {
    // Відобразити форму створення нового працівника
    res.render("new-drug.ejs", { currentUser: req.session.currentUser })
})

router.get("/:id/update", isAuthenticated, (req, res) => {
    db.Comment.findById(req.params.id)
        .then(comment => {
            // Якщо клієнта знайдено, відрендерити сторінку профілю та передати шаблону дані клієнта та currentUser
            res.render("update-drug.ejs", {
                comment: comment,
                // Включаємо відображення персоналізованого контенту, передавши шаблону currentUser
                currentUser: req.session.currentUser,
                id: req.params.id
            })
        })
})

// Показати маршрут: Відобразити деталі для конкретного працівника
router.get("/:id", (req, res) => {
    console.log(req.params.id)
    db.Comment.findById(req.params.id)
        .then(comment => {
            if (!comment) {
                return res.status(404).json({ error: "comment not found" });
            }

            res.render("drug-details.ejs", {
                drug: drug,
                comments: comentById,
                currentUser: req.session.currentUser
            });
        })


        .catch(err => {
            res.status(500).json({ error: err.message });
        });
})


//Створити маршрут для створення нового працівника
router.post('/', isAuthenticated, async (req, res) => {

    const comment = {
        comment: req.body.comment,
        title: req.body.title,
    }

    // Зберегти нового працівника в базі даних
    await db.Comment.create(comment)

    // Перенаправлення після успішного створення працівника
    res.redirect("/drugs")
})

//Створити маршрут для оновлення працівника
router.put('/:id', isAuthenticated, async (req, res) => {
    //пошук працівника в базі данних
    const comment = await db.Comment.find({
        _id: { $ne: req.params.id }
    });
    //Перевірка чи знайдений працівник
    if (!comment) {
        res.json({ status: 404, message: 'comment not found' })
    }

    const updateComment = {
        comment: req.body.comment,
        title: req.body.title,
    }

    // Оновлення бази данних новими даними про працівника
    await db.Comment.updateOne({ _id: req.params.id }, { $set: updateComment }, { new: true })

    // Перенаправлення після успішного створення працівника
    res.redirect("/drugs")
})


// DELETE - видалити певного клієнта, а потім перенаправити
router.delete("/:id", isAuthenticated, (req, res) => {
    // Знайти працівника за його ідентифікатором
    db.Comment.findById(req.params.id)
        .then((comment) => {
            // Перевірка наявності клієнта
            if (!comment) {
                // Обробка помилки, якщо клієнт не знайден
                return res.json({ status: 404, message: "comment not found" })
            }
            // Видалення
            db.Comment.findByIdAndDelete(req.params.id)
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