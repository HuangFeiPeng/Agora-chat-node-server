
const bodyParser = require('body-parser')
const express = require('express')
const service = require('./utils/request')
const { AccessToken2, ServiceChat } = require('./utils/AccessToken2')
const { request, response } = require('express')
const app = express()
const port = 9000
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }));
//appId
const appID = 'f1dc778bddc646ad8f260976ca2d015c';
const orgName = '41117440';
const appName = '383391'
//appCertificate 证书
const appCertificate = 'b5a23fd8013a4db8bb06f7d1e26da789';
//expirationTimeInSeconds 过期时间
const expirationTimeInSeconds = 3600
//当前时间currentTimestamp
const currentTimestamp = Math.floor(Date.now() / 1000)

let token = new AccessToken2(appID, appCertificate, currentTimestamp, expirationTimeInSeconds)
//获取App级别token用来进行一系列注册置换User请求
const fetchAppAccessToken = () => {
    return new Promise((resolve, reject) => {
        let chat_service = new ServiceChat()
        chat_service.add_privilege(ServiceChat.kPrivilegeApp, expirationTimeInSeconds)
        token.add_service(chat_service)
        let buiderAppToken = token.build()
        resolve(buiderAppToken)
    })
}
//获取用户token
const fetchUsersAccessToken = (userId) => {
    return new Promise((resolve, reject) => {
        let chat_service = new ServiceChat(userId)
        chat_service.add_privilege(ServiceChat.kPrivilegeUser, expirationTimeInSeconds)
        token.add_service(chat_service)
        let builderUsersToken = token.build()
        resolve(builderUsersToken)
    })

}
//注册用户接口
app.post('/api/agorachat/register', async (request, response) => {
    console.log('有人进行了该接口的访问！', 'response',
        response);
    let appToken = await fetchAppAccessToken()
    service.interceptors.request.use(config => {
        config.headers['Authorization'] = `Bearer ${appToken}`
        return config
    })
    let params = { ...request.body };
    try {
        let resData = await service({
            url: `/${orgName}/${appName}/users`,
            method: 'post',
            data: params
        })
        console.log('>>>>>请求成功', resData);
        return response.send(resData)

    } catch (error) {
        console.log('>>>>>请求失败', error);
        response.status(error.code)
        return response.send(error)
    }

})

//置换登陆token接口
app.post('/api/agorachat/usertoken', async (request, response) => {
    console.log('>>>>>请求过来的参数', request.body);
    if (request.body && request.body.userId) {
        let { userId } = request.body
        let userToken = await fetchUsersAccessToken(userId)
        console.log('>>>>请求了置换token的接口', userToken)
        response.send({ accessToken: userToken, expirationTimeInSeconds })
    } else {
        response.status(400)
        return response.send({ code: 400, error: { error_description: "userId cannot '' or null " } })
    }
})
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})