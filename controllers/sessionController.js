//Імпорт bcrypt для хешування паролів, що дозволяє безпечно зберігати та порівнювати паролі співробітників
const bcrypt = require("bcrypt")
// Імпортуйте моделі баз даних для взаємодії з базою даних MongoDB, зокрема для операцій, пов'язаних з працівниками
const db = require("../models")
// Створіть новий експрес-маршрутизатор для визначення маршрутів, пов'язаних з управлінням сесіями (вхід, реєстрація, вихід)
const router = require("express").Router()

// Маршрут для відображення сторінки входу в систему.  
router.get("/signin", (req, res) => {
    const errorMessage = req.session.errorMessage;
    delete req.session.errorMessage; // Clear the error message
    res.render("signin.ejs", { currentUser: null, errorMessage: errorMessage }) //'currentUser' is null since the user is not authenticated yet
})
//Вхід
// POST-маршрут для обробки форми входу в систему
router.post("/signin", async (req, res) => {
    try {
        // Спроба знайти існуючого співробітника в базі даних за його email
        const foundClient = await db.Clients.findOne({ email: req.body.email })
        // Якщо співробітника не знайдено, повідомити клієнту, що існуючого користувача не знайдено
        if (!foundClient) {
            req.session.errorMessage = 'No existing user found. Please sign up.'
            return res.redirect("/session/signin?error=true")
        } else if (bcrypt.compareSync(req.body.password, foundClient.password)) {
            // Якщо співробітник знайдений і надісланий пароль співпадає з хешованим паролем в базі даних
            //Зберегти інформацію про співробітника в сесії, щоб підтвердити, що він увійшов в систему 
            req.session.currentUser = foundClient
            // Після успішного входу перенаправляємо співробітника на сторінку його профілю
            res.redirect('/profile')
        } else {
            // Якщо паролі не збігаються, повідомити про це нижче
            req.session.errorMessage = 'Password does not match.'
            return res.redirect("/session/signin?error=true")
        }
    }
    catch (err) {
        console.log(err);
        req.session.errorMessage = 'An error occurred. Please try again.';
        return res.redirect("/session/signin?error=true"); // Перенаправлення на реєстрацію із запитом на помилку
    }
})
// Маршрут для відображення сторінки реєстрації. Як і у випадку з маршрутом для входу, тут 'currentUser' дорівнює нулю
router.get("/signup", (req, res) => {
    res.render("signup.ejs", { currentUser: null })  //'currentUser' дорівнює нулю, оскільки користувач ще не автентифікований
})

//Реєстрація
// POST-маршрут для обробки відправки форми реєстрації
router.post('/signup', async (req, res) => {
    // Знайти за email існуючого співробітника, який намагається зареєструватися, щоб порівняти паролі
    try {
        // Спроба знайти існуючого співробітника в базі даних за його email
        const foundClient = await db.Clients.findOne({ email: req.body.email })
        // Якщо співробітник вже зареєстрований з даним email, запропонувати йому зареєструватися замість нього
        if (foundClient) {
            return res.send('Found existing client record. Please sign in.')

        } else {
            // Перевірити, чи збігаються наданий пароль та пароль підтвердження
            if (req.body.password !== req.body.confirmPassword) {
                return res.send('Password does not match')
            }
            // Для безпеки хешувати наданий пароль перед тим, як зберігати його в базі даних
            const hashedString = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10))
            // Виключити поле confirmPassword з тіла запиту перед створенням нового запису співробітника
            const { confirmPassword, ...rest } = req.body
            // Створити новий запис про співробітника в базі даних з хешованим паролем.
            const newClient = await db.Clients.create({
                ...rest, password: hashedString
            })
            // Зареєструвати нового співробітника, зберігши його дані в сесії
            req.session.currentUser = newClient
            // Перенаправлення співробітника на сторінку його профілю після успішної реєстрації
            res.redirect('/profile')
        }
    }
    catch (err) {
        console.log(err)
    }
})

// Маршрут для відображення сторінки входу в систему.  
router.get("/admin/signin", (req, res) => {
    const errorMessage = req.session.errorMessage;
    delete req.session.errorMessage; // Clear the error message
    res.render("admin-signin.ejs", { currentUser: null, errorMessage: errorMessage }) //'currentUser' is null since the user is not authenticated yet
})
//Вхід
// POST-маршрут для обробки форми входу в систему
router.post("/admin/signin", async (req, res) => {
    try {
        // Спроба знайти існуючого співробітника в базі даних за його email
        const foundAdmin = await db.Admin.findOne({ email: req.body.email })
        // Якщо співробітника не знайдено, повідомити клієнту, що існуючого користувача не знайдено
        if (!foundAdmin) {
            req.session.errorMessage = 'No existing user found. Please sign up.'
            return res.redirect("/session/admin/signin?error=true")
        } else if (bcrypt.compareSync(req.body.password, foundAdmin.password)) {
            // Якщо співробітник знайдений і надісланий пароль співпадає з хешованим паролем в базі даних
            //Зберегти інформацію про співробітника в сесії, щоб підтвердити, що він увійшов в систему 
            req.session.currentUser = foundAdmin
            // Після успішного входу перенаправляємо співробітника на сторінку його профілю
            res.redirect('/profile')
        } else {
            // Якщо паролі не збігаються, повідомити про це нижче
            req.session.errorMessage = 'Password does not match.'
            return res.redirect("/session/admin/signin?error=true")
        }
    }
    catch (err) {
        console.log(err);
        req.session.errorMessage = 'An error occurred. Please try again.';
        return res.redirect("/session/admin/signin?error=true"); // Перенаправлення на реєстрацію із запитом на помилку
    }
})
// Маршрут для відображення сторінки реєстрації. Як і у випадку з маршрутом для входу, тут 'currentUser' дорівнює нулю
router.get("/admin/signup", (req, res) => {
    res.render("admin-signup.ejs", { currentUser: null })  //'currentUser' дорівнює нулю, оскільки користувач ще не автентифікований
})

//Реєстрація
// POST-маршрут для обробки відправки форми реєстрації
router.post('/admin/signup', async (req, res) => {
    // Забезпечити використання корпоративного поштового домену для реєстрації
    const email = req.body.email
    const domain = "@example.com"
    if (!email.endsWith(domain)) {
        req.session.errorMessage = 'Please use your corporate email domain.'
        return res.redirect("/session/admin/signin?error=true")
    }
    // Знайти за email існуючого співробітника, який намагається зареєструватися, щоб порівняти паролі
    try {
        // Спроба знайти існуючого співробітника в базі даних за його email
        const foundAdmin = await db.Admin.findOne({ email: req.body.email })
        // Якщо співробітник вже зареєстрований з даним email, запропонувати йому зареєструватися замість нього
        if (foundAdmin) {
            return res.send('Found existing admin record. Please sign in.')

        } else {
            // Перевірити, чи збігаються наданий пароль та пароль підтвердження
            if (req.body.password !== req.body.confirmPassword) {
                return res.send('Password does not match')
            }
            // Для безпеки хешувати наданий пароль перед тим, як зберігати його в базі даних
            const hashedString = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10))
            // Виключити поле confirmPassword з тіла запиту перед створенням нового запису співробітника
            const { confirmPassword, ...rest } = req.body
            // Створити новий запис про співробітника в базі даних з хешованим паролем.
            const newAdmin = await db.Admin.create({
                ...rest, password: hashedString
            })
            // Зареєструвати нового співробітника, зберігши його дані в сесії
            req.session.currentUser = newAdmin
            // Перенаправлення співробітника на сторінку його профілю після успішної реєстрації
            res.redirect('/profile')
        }
    }
    catch (err) {
        console.log(err)
    }
})

//Вихід
// Обробка виходу з системи шляхом знищення сесії та перенаправлення на сторінку входу в систему
router.get("/signout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/")
    })
})

module.exports = router