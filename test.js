const bcrypt = require('bcryptjs')
const crypto = require('crypto')

async function func() {
    // const salt = await bcrypt.genSalt(10);
    // const hashedToken = await bcrypt.hash('ali', 'a');

    const hashedToken = crypto.createHash('sha256').update('alia').digest('hex');

    console.log(hashedToken);
}
func()
