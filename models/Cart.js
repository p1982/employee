const mongoose = require("mongoose");

// Модель, яка контролює створення кошика
const cartSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    count: {
        type: Number,
        required: true
    },
    img_url: {
        type: String,
        required: true
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clients',
        required: true
    },
});

// експорт моделі
module.exports = mongoose.model("Cart", cartSchema);