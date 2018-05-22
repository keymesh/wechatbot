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

const sentURLs = new Map()

const todoList = []
async function doitnow() {
    const func = todoList.pop()
    if (func) {
        await func()
        setTimeout(doitnow, 5 * 1000)
        return
    }

    setTimeout(doitnow, 100)
}
doitnow()

function todoListMonitor() {
    console.log(`todoList.length = ${todoList.length}`)
    setTimeout(todoListMonitor, 60 * 1000)
}
todoListMonitor()

const handleScan = async (url, code) => {
    if (!/201|200/.test(String(code))) {
        const loginUrl = url.replace(/\/qrcode\//, '/l/')
        require('qrcode-terminal').generate(loginUrl)
    }

    console.log(`${url}\n[${code}] Scan QR Code in above url to login: `)
    if (sentURLs.has(url)) {
      return
    }

    sentURLs.set(url, true)
    setTimeout(() => {
      sentURLs.delete(url)
    }, 60 * 1000)

    const msg = {
        to: ENV.recipientEmails,
        from: 'hi@keymesh.io',
        subject: 'Wechat bot login',
        html: `<img src="${url}" />`,
    };
    sgMail.sendMultiple(msg);
    serverJiang('wechat bot scan', `![logo](${url})`)
}

Wechaty.instance() // Singleton
.on('scan', handleScan)
.on('login',       user => console.log(`User ${user} logined`))
.on('message',  async message => {
    console.log(`Message: ${message}`)
    if (!message.room()) {
        const id = message.content().trim()
        if (/^[0-9a-zA-Z]{15,}$/.test(id)) {
            todoList.unshift(() => sendPromoMessages(message, id))
        }
    }
}).on('friend', async (friend, request) => {
    if (request) {
        console.log(`Contact: ${friend.name()} send request ${request.hello}`)

        todoList.unshift(() => request.accept())
        todoList.unshift(() => sendWelcome(friend))
    }
})
.start()

async function getPromoImgPath(inviter) {
    const filePath = ENV.tempPath + "/" + generateRandomStr()
    await QRCode.toFile(filePath, `https://airdrop.keymesh.io/i/${inviter}`, {
        scale: 7,
        margin: 1,
    })

    const promoImgPath = filePath + '.png'
    images(ENV.backgroundPath)
        .draw(images(filePath), 254, 543)
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

const welcomeMsg1 = `欢迎关注 KeyMesh 微信小助手`
const welcomeMsg2 = `请将你的邀请码发给我，以生成您专属的邀请二维码`
async function sendWelcome(sayer) {
    todoList.unshift(() => sayer.say(welcomeMsg1))
    todoList.unshift(() => sayer.say(welcomeMsg2))
}

const promoMsg1 = `感谢您关注 KeyMesh 第一期空投，
KeyMesh 致力打造一个去中心化安全的通讯平台。

参与本空投的奖励规则如下：
本期（第一期）参与者：
注册领取 300 KMH，加入电报群获得 700 KMH，
邀请注册奖励 2000 KMH，多邀多送

KeyMesh 项目已进入 Beta 版，
点击 https://keymesh.io/ 进行体验。

官方社区QQ群：460796055

公众号搜索: Keymesh
关注项目最新进展及第二期空投信息。

您可以在朋友圈发放专属邀请二维码获取更多奖励：`

async function sendPromoMessages(sayer, id) {
    todoList.unshift(() => sayer.say(promoMsg1))

    // send promotional image
    const promoImgPath = await getPromoImgPath(id)
    todoList.unshift(async () => {
        await sayer.say(new MediaMessage(promoImgPath))
        fs.unlinkSync(promoImgPath)
    })
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
