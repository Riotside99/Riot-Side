const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

const port = process.env.PORT || 3000;

// إعدادات الديسكورد - سيتم سحبها من Railway Variables
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

app.use(express.static(__dirname));

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// مسار تسجيل الدخول
app.get('/login', (req, res) => {
    const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;
    res.redirect(url);
});

// مسار استقبال البيانات بعد موافقة المستخدم (Callback)
app.get('/callback', async (req, res) => {
    const { code } = req.query;
    try {
        // تبادل الـ Code بـ Access Token
        const response = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

        // جلب بيانات المستخدم
        const userRes = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${response.data.access_token}` }
        });

        // إرسال المستخدم للرئيسية مع بياناته في الرابط (لتبسيط الأمر حالياً)
        const user = userRes.data;
        res.redirect(`/?name=${user.username}&avatar=${user.avatar}&id=${user.id}`);
    } catch (error) {
        res.send('حدث خطأ أثناء تسجيل الدخول');
    }
});

app.listen(port, () => console.log(`Riot Side is running on port ${port}`));
