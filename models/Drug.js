const mongoose = require("mongoose")
//Ьщдель, яка контролює створення співробітника
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
//експорт модели
module.exports = mongoose.model("Drug", drugSchema);