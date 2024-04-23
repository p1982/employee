// Функція проміжного програмного забезпечення для перевірки статусу автентифікації працівника
const isAuthenticated = (req, res, next) => {
  // Перевірка наявності в сесії об'єкту currentUser, що вказує на працівника 
  if (req.session.currentUser) {
    return next()
  } else {
    // Якщо співробітник не авторизований, перенаправити його на сторінку входу
    res.redirect('/session/signin')
  }
}

module.exports = isAuthenticated