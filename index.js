const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

const port = process.env.PORT || 8080;

// التأكد من سحب المتغيرات من Railway
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// مسار تسجيل الدخول الذي يستدعيه الزر
app.get('/login', (req, res) => {
    if (!CLIENT_ID || !REDIRECT_URI) {
        return res.send("خطأ: لم يتم ضبط CLIENT_ID أو REDIRECT_URI في Railway Variables");
    }
    const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;
    res.redirect(url);
});

// مسار الاستقبال بعد موافقة المستخدم
app.get('/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const response = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

        const userRes = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${response.data.access_token}` }
        });

        const user = userRes.data;
        // العودة للرئيسية مع بيانات اللاعب
        res.redirect(`/?name=${encodeURIComponent(user.username)}&avatar=${user.avatar}&id=${user.id}`);
    } catch (error) {
        res.status(500).send('فشل تسجيل الدخول، تأكد من إعدادات Discord Developer Portal');
    }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
 
