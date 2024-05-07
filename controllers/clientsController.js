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

// Функція-обробник маршруту для очищення та заповнення колекції Clients з API randomuser.me
// Функція для очищення та подальшого заповнення колекції Clients
function fetchAndCreateClients(req, res) {
  // Спочатку очищаємо існуючу колекцію Clients
  return db.Clients.deleteMany({})
    .then(deletedData => {
      console.log(`Removed ${deletedData.deletedCount} Clients`)
      // Отримати та вставити нові дані про співробітників з API
      return axios.get('https://randomuser.me/api/', {
        params: { results: 40, nat: "UA" } // Об'єкт, що містить параметри рядка запиту, який буде додано до URL. Посилання: https://apidog.com/blog/params-axios-get-request/
      })
    })
    .then(response => {
      const clientsData = response.data.results
      const clients = clientsData.map(user => {
        //Для кожного працівника викликається getRandomDepartmentAndPosition для присвоєння відділу та посади
        return {
          firstName: user.name.first,
          lastName: user.name.last,
          email: user.email,
          phoneNumber: user.phone,
          picture: user.picture.large,
          username: user.login.username,
          password: bcrypt.hashSync(user.login.password, bcrypt.genSaltSync(10)),
          isAdmin: false
        }
      })
      // Вставляємо дані нового працівника в колекцію
      return db.Clients.insertMany(clients)
    })
    .then(addedClients => {
      console.log(`Added ${addedClients.length} new clients`)
      res.json(addedClients)
    })
    .catch(error => {
      console.error('Error in the seeding process:', error)
    })
}

//Маршрут для виклику функції fetchAndCreateClients при GET-запиті 
router.get('/seed', fetchAndCreateClients)

// // НОВИЙ - показати форму для створення нових співробітників
router.get("/new", isAuthenticated, (req, res) => {
  // Відобразити форму створення нового працівника
  res.render("new-client.ejs", { currentUser: req.session.currentUser })
})

router.get("/:id/update", isAuthenticated, (req, res) => {
  db.Clients.findById(req.params.id)
    .then(client => {
      // Якщо співробітника знайдено, відрендерити сторінку профілю та передати шаблону дані співробітника та currentUser
      res.render("update-client.ejs", {
        client: client,
        // Включаємо відображення персоналізованого контенту, передавши шаблону currentUser
        currentUser: req.session.currentUser,
        id: req.params.id
      })
    })
})

// Показати маршрут: Відобразити деталі для конкретного працівника
router.get("/:id", isAuthenticated, (req, res) => {
  db.Clients.findById(req.params.id)
    .then(client => {
      res.render("client-details.ejs", { client: client, currentUser: req.session.currentUser })
    })
    .catch(err => {
      res.status(500).json({ error: err.message })
    })
})


// Застосувати проміжне ПЗ isAuthenticated до всіх маршрутів на цьому маршрутизаторі, щоб забезпечити доступ тільки для автентифікованих співробітників
// Визначити маршрут для доступу до сторінки профілю
router.get("/", isAuthenticated, (req, res) => {
  // Знайти в базі даних поточного аутентифікованого співробітника за його ідентифікатором, збереженим у сесії
  db.Clients.find()
    .then(clients => {
      // Якщо співробітника знайдено, відрендерити сторінку профілю та передати шаблону дані співробітника та currentUser
      res.render("clients.ejs", {
        clients: clients,
        // Включаємо відображення персоналізованого контенту, передавши шаблону currentUser
        currentUser: req.session.currentUser
      })
    })
    .catch(err => res.status(500).json({ error: err.message }))
})


//Створити маршрут для створення нового працівника
router.post('/', isAuthenticated, async (req, res) => {

  const newClient = {
    lastName: req.body.lastName,
    firstName: req.body.firstName,
    email: req.body.email,
    phoneNumber: req.body.phoneNumber,
    picture: req.body.picture,
    username: req.body.username,
    password: bcrypt.hashSync("111111", bcrypt.genSaltSync(10))
  }

  // Зберегти нового працівника в базі даних
  await db.Clients.create(newClient)

  // Перенаправлення після успішного створення працівника
  res.redirect("/clients")
})

//Створити маршрут для оновлення працівника
router.put('/:id', isAuthenticated, async (req, res) => {
  //пошук працівника в базі данних
  const client = await db.Clients.find({
    _id: { $ne: req.params.id }
  });
  //Перевірка чи знайдений працівник
  if (!client) {
    res.json({ status: 404, message: 'Client not found' })
  }

  const updateClient = {
    lastName: req.body.lastName,
    firstName: req.body.firstName,
    email: req.body.email,
    phoneNumber: req.body.phoneNumber,
    picture: req.body.picture,
    username: req.body.username,
  }

  // Оновлення бази данних новими даними про працівника
  await db.Clients.updateOne({ _id: req.params.id }, { $set: updateClient }, { new: true })

  // Перенаправлення після успішного створення працівника
  res.redirect("/clients")
})


// DELETE - видалити певного співробітника, а потім перенаправити
router.delete("/:id", isAuthenticated, (req, res) => {
  // Знайти працівника за його ідентифікатором
  db.Clients.findById(req.params.id)
    .then((client) => {
      // Перевірка наявності співробітника
      if (!client) {
        // Обробка помилки, якщо співробітник не знайден
        return res.json({ status: 404, message: "Client not found" })
      }
      // Видалення
      db.Clients.findByIdAndDelete(req.params.id)
        .then(() => {
          // Перехід на сторінку всіх співробітників
          res.redirect("/clients")
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