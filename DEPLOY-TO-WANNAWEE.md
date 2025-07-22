# 🚀 DEPLOY TO WANNAWEE.COM - FINAL STEPS

## ✅ ALL CONFIGURED AND READY!

✅ **Neon Database:** Connected and schema initialized  
✅ **AWS S3 Bucket:** Ready for photo uploads  
✅ **Production Build:** Compiled successfully  
✅ **Environment:** All secrets configured  

---

## 🌐 **FINAL DEPLOYMENT TO WANNAWEE.COM**

### **Option A: Upload to Your Server**

**1. Zip the entire project:**
```bash
tar -czf wannawee-production.tar.gz --exclude=node_modules --exclude=.git .
```

**2. Upload to your server and extract:**
```bash
# On your server (wherever wannawee.com points):
tar -xzf wannawee-production.tar.gz
cd wannawee-com
```

**3. Install and start:**
```bash
npm install --production
npm start
```

### **Option B: Direct Server Deployment**

**If you have SSH access to your wannawee.com server:**
```bash
rsync -av --exclude=node_modules --exclude=.git . user@wannawee.com:/var/www/wannawee/
ssh user@wannawee.com "cd /var/www/wannawee && npm install --production && npm start"
```

---

## ⚙️ **SERVER CONFIGURATION**

The app runs on **port 5000**. Configure your web server:

### **Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name wannawee.com www.wannawee.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### **Apache Configuration:**
```apache
<VirtualHost *:80>
    ServerName wannawee.com
    ServerAlias www.wannawee.com
    
    ProxyRequests Off
    ProxyPreserveHost On
    ProxyPass / http://localhost:5000/
    ProxyPassReverse / http://localhost:5000/
</VirtualHost>
```

---

## 🔒 **SSL CERTIFICATE (HTTPS)**

**Get free SSL with Certbot:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d wannawee.com -d www.wannawee.com
```

---

## ✅ **FINAL CHECKLIST**

After deployment, verify:

1. **🌐 Site loads:** https://wannawee.com
2. **🚽 Favicon shows:** Toilet icon in browser tab
3. **📱 Mobile works:** Responsive design
4. **🗺️ Maps load:** Try searching "Tokyo" or "London"
5. **🌍 Languages work:** Toggle ES ⇄ EN button
6. **📸 Photos upload:** Test in any app (uploads to S3)
7. **🔐 SSL certificate:** Green padlock in browser

---

## 🎉 **WANNAWEE.COM IS LIVE!**

**Your app is now serving:**
- 🚽 **WannaWee** - Global bathroom finder
- 🙏 **WannaPray** - Prayer rooms worldwide  
- 💪 **WannaWorkOut** - Fitness equipment locator
- 🛝 **WannaPlay** - Playground discovery
- 🛹 **WannaRoll** - Skate park finder
- 🐕 **WannaWalktheDog** - Dog park locator

**All with 13 languages, photo uploads, and mobile optimization!**

---

## 🆘 **NEED HELP?**

**If anything doesn't work:**
1. Check server logs: `npm start` (look for errors)
2. Verify DNS: `nslookup wannawee.com`
3. Test direct access: `http://your-server-ip:5000`
4. Check SSL: Use online SSL checker tools

**🎯 You're 99% done - just need to upload and configure your web server!**