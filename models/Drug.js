const mongoose = require("mongoose");

// Модель, яка контролює створення ліків
const drugSchema = new mongoose.Schema({
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
  isAvailable: {
    type: Boolean,
    required: true
  },
  img_url: {
    type: String,
    required: true
  },
});

// експорт моделі
module.exports = mongoose.model("Drugs", drugSchema);