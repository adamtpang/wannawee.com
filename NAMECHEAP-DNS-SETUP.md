# 🌐 NAMECHEAP DNS SETUP FOR WANNAWEE.COM

## **Railway URL:** `pkg1zc2k.up.railway.app`

---

## **STEP 1: Railway Custom Domain**

**In Railway Dashboard:**
1. **Settings → Domains**
2. **"Custom Domain" → Add:** `wannawee.com`
3. **Also add:** `www.wannawee.com`
4. **Railway will show "Waiting for DNS"**

---

## **STEP 2: Namecheap DNS Records**

**Login to Namecheap → Domain List → wannawee.com → Manage → Advanced DNS**

**Add these EXACT records:**

### **Record 1:**
- **Type:** CNAME Record
- **Host:** @
- **Value:** `pkg1zc2k.up.railway.app`
- **TTL:** Automatic

### **Record 2:**
- **Type:** CNAME Record
- **Host:** www
- **Value:** `pkg1zc2k.up.railway.app`
- **TTL:** Automatic

---

## **STEP 3: Wait & Verify**

**Wait 5-30 minutes for DNS propagation**

**Test these URLs:**
- ✅ https://wannaweecom-production.up.railway.app (should work now)
- ⏳ https://wannawee.com (will work after DNS)
- ⏳ https://www.wannawee.com (will work after DNS)

---

## **🔍 Troubleshooting:**

**Check DNS propagation:**
- https://dnschecker.org
- Enter: `wannawee.com`
- Should show: `wannaweecom-production.up.railway.app`

**Check SSL:**
- Railway auto-generates SSL certificates
- Green padlock should appear once DNS resolves

---

## **🎉 FINAL RESULT:**

**Once DNS propagates, these will all work:**
- https://wannawee.com → WannaWee app selector
- https://wannawee.com/wannawee → Bathroom finder
- https://wannawee.com/wannapray → Prayer room finder
- All 6 mapping apps with 13 languages! 🌍

**Railway handles everything: SSL, load balancing, auto-scaling! 🚀**