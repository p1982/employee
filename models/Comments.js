const mongoose = require("mongoose");

// Модель, яка контролює створення Коментаря
const commentsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  comment: {
    type: String,
    required: true
  },
  client: {
    type: String,
    required: true
  },
  drug: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drugs',
    required: true
  },
  answers: {
    type: [Array, String],
  }
});

// експорт моделі
module.exports = mongoose.model("Comment", commentsSchema);