const mongoose = require("mongoose")
//Модель, яка контролює створення співробітника
const adminSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  picture: {
    type: String, 
    required: true,
  },
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }, 
  isAdmin: {
    type: Boolean,
    required: true,
    default: true
  }
});
//експорт модели
module.exports = mongoose.model("Admin", adminSchema);