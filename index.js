const { sleep } = require('sleep')
const { Wechaty, Room, MediaMessage } = require('wechaty')
const sgMail = require('@sendgrid/mail');

function getEnv(k) {
    const key = `KEY_MESH_WECHAT_BOT_${k}`
    return process.env[key]
}

const ENV = {
    pushBearSendKey: getEnv('PUSH_BEAR_SEND_KEY'),
    tempPath: getEnv('TEMP_PATH'),
    backgroundPath: getEnv('BACKGROUND'),
    sendgridApiKey: getEnv('SENDGRID_API_KEY'),
    recipientEmails: JSON.parse(getEnv('RECIPIENT_EMAILS')),
}
console.log("ENV: ", ENV)
sgMail.setApiKey(ENV.sendgridApiKey)

const QRCode = require('qrcode'),
    images = require("images"),
    fs = require("fs"),
    stream = require("stream")

const handleScan = async (url, code) => {
    if (!/201|200/.test(String(code))) {
        const loginUrl = url.replace(/\/qrcode\//, '/l/')
        require('qrcode-terminal').generate(loginUrl)
    }

    const msg = {
        to: ENV.recipientEmails,
        from: 'hi@keymesh.io',
        subject: 'Wechat bot login',
        html: `<img src="${url}" />`,
    };
    sgMail.sendMultiple(msg);
    serverJiang('wechat bot scan', `![logo](${url})`)
    console.log(`${url}\n[${code}] Scan QR Code in above url to login: `)
}

Wechaty.instance() // Singleton
.on('scan', handleScan)
.on('login',       user => console.log(`User ${user} logined`))
.on('message',  async message => {
    console.log(`Message: ${message}`)
    const content = message.content().trim()
    if (/^saywelcometome$/.test(content)) {
        await sendWelcome(message)
        /*
        const promoImgPath = await getPromoImgPath('bob')
        await message.say(new MediaMessage(promoImgPath))
        fs.unlinkSync(promoImgPath)
        */
    } else if (/^[0-9a-zA-Z]{15,}$/.test(content)) {
        await sendPromoMessages(message, content)
    }
}).on('friend', async (friend, request) => {
    if (request) {
        // query email
        // const email = request.hello
        console.log(`Contact: ${friend.name()} send request ${request.hello}`)
        /*
        const id = await getMemberID(email)
        if (id == '') {
            console.log('you need sign up first')
            return
        }
        */

        await request.accept()
        await sendWelcome(friend)
        /*
        let keymeshRoom = await Room.find({topic: /welcome/})
        if (keymeshRoom) {
            await keymeshRoom.add(friend)
            console.log(`invited user to the group`)
            await keymeshRoom.say("Welcome!", friend)
        }
        */
    }
})
.start()

async function getPromoImgPath(inviter) {
    const filePath = ENV.tempPath + "/" + generateRandomStr()
    await QRCode.toFile(filePath, `https://airdrop.keymesh.io/i/${inviter}`)

    const promoImgPath = filePath + '.png'
    images(ENV.backgroundPath)
        .draw(images(filePath), 10, 10)
        .save(promoImgPath, {
            quality: 50,
        })

    fs.unlinkSync(filePath)

    return promoImgPath
}

function generateRandomStr() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 10; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

/*
async function getMemberID(email) {
    let id = ''
    try {
        const resp = await axios.get(process.env.GET_MEMBER_ID_URL, {
            params: {
                email,
            }
        })
        id = resp.data.id
    } finally {
        return id
    }
}
*/

const welcomeMsg1 = `欢迎关注 KeyMesh 微信小助手`
const welcomeMsg2 = `请将你的邀请码发给我，以生成您专属的邀请二维码`
async function sendWelcome(sayer) {
    sayer.say(welcomeMsg1)
    sayer.say(welcomeMsg2)
}

const promoMsg1 = `感谢您关注 KeyMesh 第一期空投。KeyMesh 致力打造一个去中心化，安全的社交通讯平台。

参与本空投的奖励规则如下:

blah blah blah

为了方便扩散，您可以在朋友圈或者群里转发
下面的图片：
`
async function sendPromoMessages(sayer, id) {
    await sayer.say(promoMsg1)

    // send promotional image
    const promoImgPath = await getPromoImgPath(id)
    await sayer.say(new MediaMessage(promoImgPath))
    fs.unlinkSync(promoImgPath)
    sleep(2)

    await sayer.say("邀请你加入 KeyMesh 空投电报群")
    await sayer.say("https://t.me/keymesh_airdrop")
}


function serverJiang(username, content) {
    const request = require('request')
    const url = 'https://pushbear.ftqq.com/sub'
    const propertiesObject = { sendkey: ENV.pushBearSendKey, text: username, desp: content }

    request.post({
        url,
        form: propertiesObject,
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            const err = JSON.parse(body)
            console.log(err)
        }
    })
}
