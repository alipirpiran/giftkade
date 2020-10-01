const path = require('path');
require('dotenv').config({
  path: path.join(process.cwd(), '../../.env'),
});
const mail_service = require('../../services/mail');

mail_service.sendMail('alipirpiran@gmail.com', 'test', 'test body');
