const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const app = express();

const { createClient } = require('@redis/client'); 

const redisClient = createClient({
    url: 'redis://redis-server:6379', 
    password: 'your-password'
});

redisClient.on('error', (err) => {
    console.error("Redis Error:", err);
});

redisClient.connect()
    .then(() => {
        console.log('Connected to Redis');
    })
    .catch((err) => {
        console.error('Redis connection error:', err);
    });

app.use(bodyParser.json()); // 解析 JSON 数据

// 随机密钥生成
const generateRandomKey = (length = 16) => {
    return crypto.randomBytes(length).toString("hex");
};

// 加密
const encryptMessage = (message, key) => {
    const cipher = crypto.createCipher("aes-256-cbc", key);
    let encrypted = cipher.update(message, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
};

// 解密
const decryptMessage = (encryptedMessage, key) => {
    const decipher = crypto.createDecipher("aes-256-cbc", key);
    let decrypted = decipher.update(encryptedMessage, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
};

// 接收消息并生成加密记录
app.post("/message", async (req, res) => {
    const { message, expireTime } = req.body; // 消息内容和过期时间
    if (!message) return res.status(400).send({ error: "Message is required." });

    const key1 = generateRandomKey(); // 随机生成密钥
    const key2 = generateRandomKey(); // 随机生成加密消息的键
    const encryptedMessage = encryptMessage(message, key1); // 加密消息

    // 存储到 Redis 中
    await redisClient.setEx(key2, expireTime || 300, encryptedMessage); // 默认 5 分钟
    await redisClient.setEx(key1, expireTime || 300, key2);

    const url = `${key1}@${key2}`;
    res.send({ url });
});

// 解密消息
app.get("/message/:keys", async (req, res) => {
    const keys = req.params.keys.split("@");
    if (keys.length !== 2) return res.status(400).send({ error: "Invalid keys." });

    const [key1, key2] = keys;

    // 从 Redis 获取加密消息
    const key2FromRedis = await redisClient.get(key1);
    if (key2FromRedis !== key2) return res.status(404).send({ error: "消息已被销毁." });

    const encryptedMessage = await redisClient.get(key2);
    if (!encryptedMessage) return res.status(404).send({ error: "消息已被销毁." });

    // 解密消息
    const decryptedMessage = decryptMessage(encryptedMessage, key1);

    // 删除 Redis 中的记录
    await redisClient.del(key1);
    await redisClient.del(key2);

    res.send({ message: decryptedMessage });
});

// 启动服务器
app.listen(14420, () => {
    console.log("Server is running on http://localhost:14420");
});
