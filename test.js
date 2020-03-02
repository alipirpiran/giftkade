const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const mongoose = require('mongoose')

console.log(mongoose.Types.ObjectId.isValid('e2f47b878fc634e9f514b4942ebad6c8'));


// async function func() {
//     // const salt = await bcrypt.genSalt(10);
//     // const hashedToken = await bcrypt.hash('ali', 'a');

//     const hashedToken = crypto.createHash('sha256').update('alia').digest('hex');

//     console.log(hashedToken);
// }
// func()
