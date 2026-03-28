const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

// استخدام المنفذ الموفر من Railway أو 3000 كافتراضي
const port = process.env.PORT || 3000;

// سحب الإعدادات من Variables
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

app.use(express.static(__dirname));

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// مسار تسجيل الدخول - التأكد من وجود البيانات قبل التوجيه
app.get('/login', (req, res) => {
    if (!CLIENT_ID || !REDIRECT_URI) {
        return res.send("خطأ: لم يتم ضبط CLIENT_ID أو REDIRECT_URI في إعدادات Railway.");
    }
    const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;
    res.redirect(url);
});

// مسار استقبال البيانات (Callback)
app.get('/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.redirect('/');

    try {
        const response = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
        }), { 
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' } 
        });

        const userRes = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${response.data.access_token}` }
        });

        const user = userRes.data;
        // إرسال البيانات للواجهة
        res.redirect(`/?name=${encodeURIComponent(user.username)}&avatar=${user.avatar}&id=${user.id}`);
    } catch (error) {
        console.error("Discord Login Error:", error.response ? error.response.data : error.message);
        res.status(500).send('حدث خطأ أثناء الاتصال بديسكورد، تأكد من صحة الـ Client Secret والـ Redirect URI.');
    }
});

app.listen(port, () => {
    console.log(`Server is active on port ${port}`);
});
 
