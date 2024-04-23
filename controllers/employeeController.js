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
const isAuthenticated = require("../controllers/isAuthenticated")

// Наперед визначені відділи та відповідні їм посади
const departments = {
  Sales: ['Account Executive', 'Sales Manager', 'Business Development Representative'],
  CustomerSupport: ['Customer Support Specialist', 'Technical Support Engineer', 'Customer Success Manager'],
  InfoSys: ['Systems Analyst', 'IT Support Specialist', 'Database Administrator'],
  Engineering: ['Software Engineer', 'DevOps Engineer', 'Frontend Developer', 'Backend Developer'],
  Data: ['Data Analyst', 'Data Scientist', 'Data Engineer'],
  Analytics: ['Business Analyst', 'Data Analyst', 'Analytics Consultant'],
  Marketing: ['Marketing Coordinator', 'SEO Specialist', 'Content Strategist'],
  Accounting: ['Accountant', 'Financial Analyst', 'Payroll Specialist'],
  HR: ['HR Manager', 'Recruitment Specialist', 'HR Coordinator'],
  Cybersecurity: ['Security Analyst', 'Cybersecurity Specialist', 'Information Security Manager'],
  NewsAndMedia: ['Content Writer', 'Social Media Manager', 'Public Relations Specialist'],
  Managers: ['Project Manager', 'Product Manager', 'Team Lead']
}

// Функція для випадкового вибору відділу та посади в цьому відділі
function getRandomDepartmentAndPosition(departments) {
  // Перетворити ключі відділів у масив та випадковим чином вибрати один з них
  const departmentKeys = Object.keys(departments)
  const randomDeptKey = departmentKeys[Math.floor(Math.random() * departmentKeys.length)]
  // Вибрати випадкову посаду з вибраного відділу
  const randomPosition = departments[randomDeptKey][Math.floor(Math.random() * departments[randomDeptKey].length)]
  return { department: randomDeptKey, position: randomPosition }
}

// Функція-обробник маршруту для очищення та заповнення колекції Employee з API randomuser.me
// Функція для очищення та подальшого заповнення колекції Employee
function fetchAndCreateEmployees(req, res) {
  // Спочатку очищаємо існуючу колекцію Employee
  return db.Employee.deleteMany({})
    .then(deletedData => {
      console.log(`Removed ${deletedData.deletedCount} employees`)
      // Отримати та вставити нові дані про співробітників з API
      return axios.get('https://randomuser.me/api/', {
        params: { results: 30, nat: "UK" } // Об'єкт, що містить параметри рядка запиту, який буде додано до URL. Посилання: https://apidog.com/blog/params-axios-get-request/
      })
    })
    .then(response => {
      const employeesData = response.data.results
      const employees = employeesData.map(user => {
        //Для кожного працівника викликається getRandomDepartmentAndPosition для присвоєння відділу та посади
        const { department, position } = getRandomDepartmentAndPosition(departments)
        return {
          firstName: user.name.first,
          lastName: user.name.last,
          department: department,
          position: position,
          email: user.email,
          phoneNumber: user.phone,
          picture: user.picture.large,
          username: user.login.username,
          password: bcrypt.hashSync(user.login.password, bcrypt.genSaltSync(10))
        }
      })
      // Вставляємо дані нового працівника в колекцію
      return db.Employee.insertMany(employees)
    })
    .then(addedEmployees => {
      console.log(`Added ${addedEmployees.length} new employees`)
      res.json(addedEmployees)
    })
    .catch(error => {
      console.error('Error in the seeding process:', error)
    })
}

//Маршрут для виклику функції fetchAndCreateEmployees при GET-запиті 
router.get('/seed', fetchAndCreateEmployees)

// // НОВИЙ - показати форму для створення нових співробітників
router.get("/new", isAuthenticated, (req, res) => {
  // Відобразити форму створення нового працівника
  res.render("new-employee.ejs", { currentUser: req.session.currentUser })
})

router.get("/:id/update", isAuthenticated, (req, res) => {
  db.Employee.findById(req.params.id)
    .then(employee => {
      // Якщо співробітника знайдено, відрендерити сторінку профілю та передати шаблону дані співробітника та currentUser
      res.render("update-employee.ejs", {
        employee: employee,
        // Включаємо відображення персоналізованого контенту, передавши шаблону currentUser
        currentUser: req.session.currentUser,
        id: req.params.id
      })
    })
})

// Показати маршрут: Відобразити деталі для конкретного працівника
router.get("/:id", isAuthenticated, (req, res) => {
  db.Employee.findById(req.params.id)
    .then(employee => {
      res.render("employee-details.ejs", { employee: employee, currentUser: req.session.currentUser })
    })
    .catch(err => {
      res.status(500).json({ error: err.message })
    })
})


// Застосувати проміжне ПЗ isAuthenticated до всіх маршрутів на цьому маршрутизаторі, щоб забезпечити доступ тільки для автентифікованих співробітників
// Визначити маршрут для доступу до сторінки профілю
router.get("/", isAuthenticated, (req, res) => {
  // Знайти в базі даних поточного аутентифікованого співробітника за його ідентифікатором, збереженим у сесії
  db.Employee.find()
    .then(employees => {
      // Якщо співробітника знайдено, відрендерити сторінку профілю та передати шаблону дані співробітника та currentUser
      res.render("employees.ejs", {
        employees: employees,
        // Включаємо відображення персоналізованого контенту, передавши шаблону currentUser
        currentUser: req.session.currentUser
      })
    })
    .catch(err => res.status(500).json({ error: err.message }))
})


//Створити маршрут для створення нового працівника
router.post('/', isAuthenticated, async (req, res) => {

  const newEmployee = {
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
  await db.Employee.create(newEmployee)

  // Перенаправлення після успішного створення працівника
  res.redirect("/employees")
})

//Створити маршрут для оновлення працівника
router.put('/:id', isAuthenticated, async (req, res) => {
  //пошук працівника в базі данних
  const employee = await db.Employee.find({
    _id: { $ne: req.params.id }
  });
  //Перевірка чи знайдений працівник
  if (!employee) {
    res.json({ status: 404, message: 'Employee not found' })
  }

  const updateEmployee = {
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
  await db.Employee.updateOne({ _id: req.params.id }, { $set: updateEmployee }, { new: true })

  // Перенаправлення після успішного створення працівника
  res.redirect("/employees")
})


// DELETE - видалити певного співробітника, а потім перенаправити
router.delete("/:id", isAuthenticated, (req, res) => {
  // Знайти працівника за його ідентифікатором
  db.Employee.findById(req.params.id)
    .then((employee) => {
      // Перевірка наявності співробітника
      if (!employee) {
        // Обробка помилки, якщо співробітник не знайден
        return res.json({ status: 404, message: "Employee not found" })
      }
      // Видалення
      db.Employee.findByIdAndDelete(req.params.id)
        .then(() => {
          // Перехід на сторінку всіх співробітників
          res.redirect("/employees")
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