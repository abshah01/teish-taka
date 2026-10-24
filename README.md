# তেইশ টাকা — Setup (free)
1. GitHub e repo banao, ei folder upload koro. Vercel e Import koro.
2. Vercel > Storage > Marketplace > **Upstash Redis** (free) connect koro (env auto boshe jabe).
3. Gmail: Google Account > Security > 2-Step on > **App passwords** theke 16-digit pass nao.
4. Vercel > Settings > Environment Variables e `.env.example` er sob boshao (GMAIL_USER, GMAIL_APP_PASS, ADMINS, SECRET). Tarpor Redeploy.
5. Admin: `tomarsite.vercel.app/admin.html` — ADMINS e `id:pass` diye login. Notun admin = comma diye aro `id:pass` jog kore redeploy.
Edit: public/index.html (text, itihash), admin theke payment number/price/notice.
