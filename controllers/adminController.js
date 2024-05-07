// Необхідні модулі
const express = require("express")
// Axios отримує відповідь від зовнішнього API та зберігає її в собі 
const axios = require("axios")
//Завантажує змінні оточення з .env-файлу
require("dotenv").config()
//Використовується для хешування паролів
const bcrypt = require('bcrypt')
// Моделі баз даних для MongoDB
const db = require('../models')
// Створює новий об'єкт router для керування маршрутами
const router = express.Router()
// Проміжне програмне забезпечення для перевірки автентичності працівника перед тим, як дозволити доступ до певних маршрутів
const isAuthenticated = require("./isAuthenticated")


// Функція-обробник маршруту для очищення та заповнення колекції Admin з API randomuser.me
// Функція для очищення та подальшого заповнення колекції Admin
function fetchAndCreateAdmins(req, res) {
  // Спочатку очищаємо існуючу колекцію Admin
  return db.Admin.deleteMany({})
    .then(deletedData => {
      console.log(`Removed ${deletedData.deletedCount} admins`)
      // Отримати та вставити нові дані про співробітників з API
      return axios.get('https://randomuser.me/api/', {
        params: { results: 10, nat: "UA" } // Об'єкт, що містить параметри рядка запиту, який буде додано до URL. Посилання: https://apidog.com/blog/params-axios-get-request/
      })
    })
    .then(response => {
      const adminsData = response.data.results
      const admins = adminsData.map(user => {
        //Для кожного працівника викликається getRandomDepartmentAndPosition для присвоєння відділу та посади
        return {
          firstName: user.name.first,
          lastName: user.name.last,
          email: user.email,
          phoneNumber: user.phone,
          picture: user.picture.large,
          username: user.login.username,
          password: bcrypt.hashSync(user.login.password, bcrypt.genSaltSync(10)),
          isAdmin: true
        }
      })
      // Вставляємо дані нового працівника в колекцію
      return db.Admin.insertMany(admins)
    })
    .then(addedAdmins => {
      console.log(`Added ${addedAdmins.length} new admins`)
      res.json(addedAdmins)
    })
    .catch(error => {
      console.error('Error in the seeding process:', error)
    })
}

//Маршрут для виклику функції fetchAndCreateAdmins при GET-запиті 
router.get('/seed', fetchAndCreateAdmins)

// // НОВИЙ - показати форму для створення нових співробітників
router.get("/new", isAuthenticated, (req, res) => {
  // Відобразити форму створення нового працівника
  res.render("new-admin.ejs", { currentUser: req.session.currentUser })
})

router.get("/:id/update", isAuthenticated, (req, res) => {
  db.Admin.findById(req.params.id)
    .then(admin => {
      // Якщо співробітника знайдено, відрендерити сторінку профілю та передати шаблону дані співробітника та currentUser
      res.render("update-admin.ejs", {
        admin: admin,
        // Включаємо відображення персоналізованого контенту, передавши шаблону currentUser
        currentUser: req.session.currentUser,
        id: req.params.id
      })
    })
})

// Показати маршрут: Відобразити деталі для конкретного працівника
router.get("/:id", isAuthenticated, (req, res) => {
  db.Admin.findById(req.params.id)
    .then(admin => {
      res.render("admin-details.ejs", { admin: admin, currentUser: req.session.currentUser })
    })
    .catch(err => {
      res.status(500).json({ error: err.message })
    })
})


// Застосувати проміжне ПЗ isAuthenticated до всіх маршрутів на цьому маршрутизаторі, щоб забезпечити доступ тільки для автентифікованих співробітників
// Визначити маршрут для доступу до сторінки профілю
router.get("/", isAuthenticated, (req, res) => {
  // Знайти в базі даних поточного аутентифікованого співробітника за його ідентифікатором, збереженим у сесії
  db.Admin.find()
    .then(admins => {
      // Якщо співробітника знайдено, відрендерити сторінку профілю та передати шаблону дані співробітника та currentUser
      res.render("admins.ejs", {
        admins: admins,
        // Включаємо відображення персоналізованого контенту, передавши шаблону currentUser
        currentUser: req.session.currentUser
      })
    })
    .catch(err => res.status(500).json({ error: err.message }))
})


//Створити маршрут для створення нового працівника
router.post('/', isAuthenticated, async (req, res) => {

  const newAdmin = {
    lastName: req.body.lastName,
    firstName: req.body.firstName,
    department: req.body.department,
    position: req.body.position,
    email: req.body.email,
    phoneNumber: req.body.phoneNumber,
    picture: req.body.picture,
    username: req.body.username,
    password: bcrypt.hashSync("111111", bcrypt.genSaltSync(10))
  }

  // Зберегти нового працівника в базі даних
  await db.Admin.create(newAdmin)

  // Перенаправлення після успішного створення працівника
  res.redirect("/admins")
})

//Створити маршрут для оновлення працівника
router.put('/:id', isAuthenticated, async (req, res) => {
  //пошук працівника в базі данних
  const admin = await db.Admin.find({
    _id: { $ne: req.params.id }
  });
  //Перевірка чи знайдений працівник
  if (!admin) {
    res.json({ status: 404, message: 'Admin not found' })
  }

  const updateAdmin = {
    lastName: req.body.lastName,
    firstName: req.body.firstName,
    department: req.body.department,
    position: req.body.position,
    email: req.body.email,
    phoneNumber: req.body.phoneNumber,
    picture: req.body.picture,
    username: req.body.username,
  }

  // Оновлення бази данних новими даними про працівника
  await db.Admin.updateOne({ _id: req.params.id }, { $set: updateAdmin }, { new: true })

  // Перенаправлення після успішного створення працівника
  res.redirect("/admins")
})


// DELETE - видалити певного співробітника, а потім перенаправити
router.delete("/:id", isAuthenticated, (req, res) => {
  // Знайти працівника за його ідентифікатором
  db.Admin.findById(req.params.id)
    .then((admin) => {
      // Перевірка наявності співробітника
      if (!admin) {
        // Обробка помилки, якщо співробітник не знайден
        return res.json({ status: 404, message: "Admin not found" })
      }
      // Видалення
      db.Admin.findByIdAndDelete(req.params.id)
        .then(() => {
          // Перехід на сторінку всіх співробітників
          res.redirect("/admins")
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