# EMpttap_CLink
### 使用node基于reidis进行加密消息链路的策略,消息即阅即销

### quick Start

#### 0, 安装依赖

```sh
npm install
```

#### 1, 文件放在nginx/html中,并配置nginx.conf

nginx.conf配置

```xml
        location /empttap/ {
            alias /usr/share/nginx/html/empttap;
            index index.html index.htm;
        }
    
        location /message {
            proxy_pass http://localhost:14420/message;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
```

#### 2, 修改server.js中reids的地址为本地redis地址

```js
const redisClient = createClient({
    url: 'redis://redis-server:6379', 
    password: 'your-password'
});
```

#### 3, 使用node后台启动server.js

```sh
nohup node server.js > server.log 2>&1 &
```

### 访问nginx服务器地址 IP/empttap/index.html 即可看到效果

主要提供api进行访问,前端使用参考即可

### api

#### 0, 存储加密消息

请求接口：/message

请求方式：post

入参

```json
{
    "message":"23155",	// 消息
    "expireTime":"22"	// 过期时间 (s)
}
```

返回值示例

```json
{
    url: "6074f7fc843bcb559e8e2b3d43165ead@1168cc90de72edad1a107c06a5ea2f2c"
}
```

#### 1, 获取加密消息

请求接口：/message/{Clink}

请求方式：get

返回值示例

```json
// 请求成功时
{message: "23155啊我发"}
// 消息销毁后
{error: "消息已被销毁."}
```



