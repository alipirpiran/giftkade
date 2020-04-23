const ejs = require('ejs')
async function main(){
    const result =  await ejs.renderFile(__dirname + '/views/templates/shop.ejs', {giftcards: 'test'})
    console.log(result)
    
}
main()