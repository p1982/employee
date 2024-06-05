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


// Створити маршрут для створення нового працівника
router.post('/:id', isAuthenticated, async (req, res) => {
    try {
      const drug = await db.Drug.findById(req.params.id);
      if (!drug) {
        return res.status(404).json({ error: "Drug not found" });
      }
  
      const cart = await db.Cart.findOne({
        name: drug.name,
        client: req.session.currentUser._id
      });
  
      if (!cart) {
        const newCart = {
          name: drug.name,
          price: drug.price,
          count: 1,
          img_url: drug.img_url,
          client: req.session.currentUser._id
        };
  
        // Зберегти нового корзину в базі даних
        await db.Cart.create(newCart);
      } else {
        const update = {
          count: cart.count + 1
        };
        await db.Cart.updateOne({ _id: cart._id }, { $set: update });
      }
  
      // Перенаправлення після успішного створення інсуліну
      res.redirect("/carts");
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/:id/add', isAuthenticated, async (req, res) => {
    console.log(req.params.id)
    try {
  
      // Пошук інсуліну в кошику корзини
      const cartItem = await db.Cart.findById(req.params.id)
  
      if (!cartItem) {
        return res.status(404).json({ message: 'Cart not found in cart' });
      }
     // Додавання одного до кількості
     cartItem.count += 1;

     // Збереження оновленого кошика
     await cartItem.save();
 
     // Перенаправлення після успішного оновлення інсуліну
     res.redirect("/carts"); // or any other appropriate route
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/:id/remove', isAuthenticated, async (req, res) => {
    console.log(req.params.id)
    try {
  
      // Пошук інсуліну в кошику корзини
      const cartItem = await db.Cart.findById(req.params.id)
  
      if (!cartItem) {
        return res.status(404).json({ message: 'Cart not found in cart' });
      }
      
     // Додавання одного до кількості
     cartItem.count -= 1;

     if (cartItem.count <= 0) {
      // Видалити інсулін з кошика, якщо кількість менше або дорівнює нулю
      await db.Cart.findByIdAndDelete(cartItem._id);
    } else {
      // Збереження оновленого кошика
      await cartItem.save();
    }
 
     // Перенаправлення після успішного оновлення інсуліну
     res.redirect("/carts"); // or any other appropriate route
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// DELETE - видалити певний інсулін з кошика, а потім перевірити, чи потрібно видалити сам кошик
router.delete("/:id", isAuthenticated, async (req, res) => {
    try {
      // Знайти інсулін у кошику за його ідентифікатором
      const cartItem = await db.Cart.findById(req.params.id);
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
  
      // Видалення інсуліну з кошика
      await db.Cart.findByIdAndDelete(req.params.id);
  
      // Видалити кошик, якщо він порожній
      const remainingItems = await db.Cart.find({ client: req.session.currentUser._id });
      if (remainingItems.length === 0) {
        await db.Cart.deleteMany({ client: req.session.currentUser._id });
      }
  
      // Перенаправлення після успішного видалення інсуліну
      res.redirect("/carts");
    } catch (error) {
      res.status(500).send(error.message);
    }
  });


/*  Експортуйте ці маршрути, щоб вони були доступні в `сервер.js`.
--------------------------------------------------------------- */
module.exports = router