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
  db.Drug.findById(req.params.id)
    .then(drug => {
      // Якщо клієнта знайдено, відрендерити сторінку профілю та передати шаблону дані клієнта та currentUser
      res.render("update-drug.ejs", {
        drug: drug,
        // Включаємо відображення персоналізованого контенту, передавши шаблону currentUser
        currentUser: req.session.currentUser,
        id: req.params.id
      })
    })
})

// Показати маршрут: Відобразити деталі для конкретного працівника
router.get("/:id", (req, res) => {
  console.log(req.params.id)
  db.Drug.findById(req.params.id)
  .then(drug => {
    if (!drug) {
      return res.status(404).json({ error: "Drug not found" });
    } 
      db.Comment.find()
      .then(comments => {
        const commentById = comments.filter(comment => comment.drug.toString() === req.params.id) || [];
        const mapped = commentById.map(comment => {
          const arr = comment.answers.flat(Infinity) || []
          return {...comment._doc, answers: arr}
        })
        console.log(mapped)
        res.render("drug-details.ejs", {
          drug: drug,
          comments: mapped,

          currentUser: req.session.currentUser
        });
      })
      .catch(err => {
        res.status(500).json({ error: err.message });
      });
  })
  .catch(err => {
    res.status(500).json({ error: err.message });
  });
})


// Застосувати проміжне ПЗ isAuthenticated до всіх маршрутів на цьому маршрутизаторі, щоб забезпечити доступ тільки для автентифікованих клієнтів
// Визначити маршрут для доступу до сторінки профілю
router.get("/", isAuthenticated, (req, res) => {
  // Знайти в базі даних поточного аутентифікованого клієнта за його ідентифікатором, збереженим у сесії
  db.Drug.find()
    .then(drugs => {
      // Якщо клієнта знайдено, відрендерити сторінку профілю та передати шаблону дані клієнта та currentUser
      res.render("drugs.ejs", {
        drugs: drugs,
        // Включаємо відображення персоналізованого контенту, передавши шаблону currentUser
        currentUser: req.session.currentUser
      })
    })
    .catch(err => res.status(500).json({ error: err.message }))
})


//Створити маршрут для створення нового працівника
router.post('/', isAuthenticated, async (req, res) => {

  const newDrug = {
    name: req.body.name,
    price: req.body.price,
    count: req.body.count,
    isAvailable: req.body.count?true:false,
    img_url: req.body.img_url,
  }

  // Зберегти нового працівника в базі даних
  await db.Drug.create(newDrug)

  // Перенаправлення після успішного створення працівника
  res.redirect("/drugs")
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
    isAvailable: req.body.count?true:false,
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