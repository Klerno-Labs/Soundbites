# 🎵 TikTok Shop Integration Guide - Soundbites Quiz

## 📱 Current Status: 85% TikTok-Ready

### ✅ What's Already Working
- [x] Mobile-responsive design
- [x] PWA manifest (installable app)
- [x] Brand colors consistent (#C92A76 magenta)
- [x] Fast page load
- [x] Clean, professional UI
- [x] Email capture system
- [x] Analytics tracking ready

### ⚠️ Needs Optimization (Quick Wins)

#### 1. **Social Sharing Image (Critical)**
**Current:** Using logo as OG image (not optimized)
**Needed:** 1200x630px eye-catching preview image

**Action:**
- Create a custom OG image: Quiz preview with your brand
- Shows someone taking the quiz on phone
- Text overlay: "Do You Need Better Hearing? Take Our 2-Min Quiz"
- Must be 1200x630px for TikTok/Instagram/Facebook

#### 2. **Mobile Touch Targets (Important)**
**Current:** Buttons are okay but could be bigger for TikTok users
**Needed:** Minimum 44px touch targets (Apple/Google standard)

**Quick Fix:** Already using good button sizes, but could increase slider touch area

#### 3. **Loading Speed (Important)**
**Current:** ~2-3 seconds load time
**Target:** <1 second for TikTok users (short attention span)

**Optimizations:**
- Lazy load Chart.js (only load on results page)
- Optimize images (WebP format - already using!)
- Preload critical fonts
- Minify CSS/JS for production

#### 4. **TikTok Pixel Integration (Critical for Ads)**
**Status:** Not installed yet
**Impact:** Can't track conversions or retarget visitors

---

## 🚀 Quick Implementation Plan (2 Hours)

### Phase 1: Social Sharing Optimization (30 min)

1. **Create OG Image** (Use Canva):
   - Size: 1200x630px
   - Background: Gradient (#C92A76 to #6E49B2)
   - Text: "Do You Need Better Hearing Solutions?"
   - Subtext: "Take Our Free 2-Minute Quiz"
   - Show phone mockup of quiz
   - Save as `og-image.jpg`

2. **Update index.html meta tags:**
```html
<!-- Replace current OG tags with: -->
<meta property="og:title" content="Do You Need Better Hearing? Free Quiz">
<meta property="og:description" content="Take our 2-minute quiz to discover if Soundbites can improve your hearing experience. Get personalized recommendations!">
<meta property="og:image" content="https://yourdomain.com/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:type" content="website">
<meta property="og:url" content="https://yourdomain.com">

<!-- TikTok-specific tags -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Do You Need Better Hearing? Free Quiz">
<meta name="twitter:description" content="2-minute quiz • Personalized results • Improve your hearing experience">
<meta name="twitter:image" content="https://yourdomain.com/og-image.jpg">
```

### Phase 2: TikTok Pixel Installation (15 min)

**What is TikTok Pixel?**
- Tracks user actions (quiz starts, completions, email captures)
- Enables retargeting ads
- Measures ROI from TikTok ads
- Creates lookalike audiences

**Setup Steps:**

1. **Get Your TikTok Pixel ID:**
   - Go to https://ads.tiktok.com
   - Navigate to Assets > Events
   - Create a pixel (e.g., "Soundbites Quiz Pixel")
   - Copy your Pixel ID (looks like: C9A2B3C4D5E6F7G8)

2. **Add Base Code to index.html** (before `</head>`):
```html
<!-- TikTok Pixel Code -->
<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  
  ttq.load('YOUR_PIXEL_ID_HERE');
  ttq.page();
}(window, document, 'ttq');
</script>
<!-- End TikTok Pixel Code -->
```

3. **Add Event Tracking to script.js:**

Add these events at key moments:

```javascript
// When quiz starts (after first question rendered)
if (window.ttq) {
    ttq.track('ViewContent', {
        content_type: 'quiz',
        content_name: 'Hearing Quiz Started'
    });
}

// When user completes quiz (in submitQuiz function)
if (window.ttq) {
    ttq.track('CompleteRegistration', {
        content_name: 'Quiz Completed',
        value: this.score,
        currency: 'USD'
    });
}

// When user submits email (in sendResults function)
if (window.ttq) {
    ttq.track('SubmitForm', {
        content_name: 'Email Captured',
        value: 1.00,
        currency: 'USD'
    });
}
```

### Phase 3: Mobile Optimization (20 min)

**Add these CSS improvements for TikTok users:**

```css
/* Add to styles.css */

/* Larger touch targets for mobile */
@media (max-width: 768px) {
    .btn {
        min-height: 48px;
        font-size: 1rem;
        padding: 12px 24px;
    }
    
    /* Bigger slider thumb for easier dragging */
    input[type="range"]::-webkit-slider-thumb {
        width: 32px;
        height: 32px;
    }
    
    /* Bigger radio buttons */
    input[type="radio"] {
        width: 24px;
        height: 24px;
    }
    
    /* More readable text on mobile */
    .question legend {
        font-size: 1.25rem;
        line-height: 1.4;
    }
}

/* TikTok-style animations */
.question.active {
    animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Sticky CTA at bottom (TikTok style) */
.sticky-cta {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #C92A76, #6E49B2);
    padding: 16px;
    text-align: center;
    box-shadow: 0 -4px 12px rgba(0,0,0,0.3);
    z-index: 1000;
    display: none;
}

.sticky-cta.show {
    display: block;
    animation: slideInBottom 0.3s ease-out;
}

@keyframes slideInBottom {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
}
```

### Phase 4: Performance Optimization (25 min)

**1. Lazy Load Chart.js** (only when needed):

In index.html, change:
```html
<!-- FROM this: -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<!-- TO this (remove from head, load dynamically): -->
<!-- Chart.js will be loaded only when showing results -->
```

In script.js, add before showing results:
```javascript
loadChartLibrary() {
    return new Promise((resolve, reject) => {
        if (window.Chart) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.head.appendChild(script);
    });
}

// In showResults() function, before rendering charts:
await this.loadChartLibrary();
```

**2. Preload Critical Assets:**

Add to index.html `<head>`:
```html
<!-- Preload critical resources -->
<link rel="preload" href="Main%20app/soundbites_logo_magenta.webp" as="image">
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;700;800&display=swap" as="style">
<link rel="preconnect" href="https://soundbites-quiz-backend.onrender.com" crossorigin>
```

**3. Add Loading State:**

Show instant feedback while quiz loads:
```html
<!-- Add to body, right after opening <body> tag -->
<div id="app-loader" class="app-loader">
    <div class="loader-spinner"></div>
    <p>Loading your hearing assessment...</p>
</div>

<style>
.app-loader {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #C92A76, #6E49B2);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    z-index: 9999;
    transition: opacity 0.3s;
}

.app-loader.hidden {
    opacity: 0;
    pointer-events: none;
}

.loader-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
</style>

<script>
// Hide loader when page is ready
window.addEventListener('load', () => {
    const loader = document.getElementById('app-loader');
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 300);
});
</script>
```

---

## 🎬 TikTok Developer Platform Integration

### Option 1: TikTok Login (Optional - For User Profiles)

**Use Case:** Let users sign in with TikTok to save their results

**Setup:**
1. Go to https://developers.tiktok.com
2. Create an app
3. Request "Login Kit" access
4. Get Client Key and Client Secret
5. Add TikTok Login button to quiz

**Implementation:** (Optional - only if you want social login)

### Option 2: TikTok Shop Integration (Direct Product Link)

**Best Approach:** Add "Buy on TikTok Shop" CTA in results page

**In results display (script.js), add:**
```javascript
showResults() {
    // ... existing results code ...
    
    // Add TikTok Shop CTA
    const tiktokCTA = `
        <div class="tiktok-shop-cta" style="
            background: linear-gradient(135deg, #000, #00f2ea);
            color: white;
            padding: 24px;
            border-radius: 14px;
            text-align: center;
            margin-top: 2rem;
            animation: pulse 2s infinite;
        ">
            <h3 style="margin-bottom: 1rem;">🎵 Ready to Improve Your Hearing?</h3>
            <p style="margin-bottom: 1rem;">Get Soundbites hearing solutions now!</p>
            <a href="YOUR_TIKTOK_SHOP_LINK?utm_source=quiz&utm_medium=results&utm_campaign=high-need" 
               class="btn btn-primary" 
               style="background: white; color: #000; font-weight: bold; display: inline-block;">
                🛒 Shop on TikTok
            </a>
        </div>
    `;
    
    resultContent.innerHTML += tiktokCTA;
}
```

---

## 📊 TikTok UTM Tracking Setup

### Standard UTM Structure for TikTok

**Bio Link:**
```
https://yourdomain.com?utm_source=tiktok&utm_medium=bio&utm_campaign=profile-link
```

**Video Description Links:**
```
https://yourdomain.com?utm_source=tiktok&utm_medium=video&utm_campaign=demo-oct19
```

**TikTok Shop Product Page:**
```
https://yourdomain.com?utm_source=tiktok&utm_medium=shop&utm_campaign=product-page
```

**TikTok Live Stream:**
```
https://yourdomain.com?utm_source=tiktok&utm_medium=livestream&utm_campaign=flash-sale
```

**Paid TikTok Ads:**
```
https://yourdomain.com?utm_source=tiktok&utm_medium=cpc&utm_campaign=ad-campaign-name
```

### Track in Marketing Tab

Your Marketing tab will automatically show:
- Which TikTok sources convert best
- Best day/time for TikTok traffic
- TikTok campaign ROI
- High-need users from TikTok (ready to buy!)

---

## 🎯 Deployment Checklist

### Before Going Live on TikTok:

- [ ] Create 1200x630px OG image
- [ ] Update meta tags with OG image
- [ ] Install TikTok Pixel
- [ ] Add event tracking (ViewContent, CompleteRegistration, SubmitForm)
- [ ] Test on real mobile devices (iPhone & Android)
- [ ] Add mobile touch optimizations
- [ ] Lazy load Chart.js
- [ ] Add loading spinner
- [ ] Set up UTM parameters
- [ ] Add TikTok Shop CTA to results page
- [ ] Test TikTok Shop link works
- [ ] Deploy to production URL (not localhost!)
- [ ] Verify TikTok Pixel is firing (use TikTok Pixel Helper Chrome extension)
- [ ] Submit URL to TikTok for approval (if running ads)

---

## 🚀 Deployment Options

### Option A: Vercel (Recommended - Free & Fast)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy (from Quiz folder)
cd "C:\Users\Somli\OneDrive\Desktop\Quiz"
vercel

# Follow prompts, get URL like: https://soundbites-quiz.vercel.app
```

### Option B: Netlify (Free, Simple)
1. Go to https://netlify.com
2. Drag/drop your Quiz folder
3. Get URL like: https://soundbites-quiz.netlify.app

### Option C: Render Static Site (Free)
Already set up! Your backend is on Render, can host frontend too.

---

## 📈 Success Metrics to Track

After going live, monitor in Marketing tab:

1. **TikTok Conversion Rate**: Aim for >15%
2. **TikTok High-Need %**: Higher = better qualified traffic
3. **Best TikTok Campaign**: Which content drives sales
4. **Peak Hours**: When to post/go live
5. **TikTok Shop Click-Through**: Results page → Shop

---

## 🎬 Next Steps (Priority Order)

**Week 1: Pre-Launch**
1. ✅ Create OG image (1 hour)
2. ✅ Install TikTok Pixel (30 min)
3. ✅ Deploy to production URL (1 hour)
4. ✅ Test on mobile devices (30 min)

**Week 2: Soft Launch**
5. ✅ Share quiz in TikTok bio
6. ✅ Post 3-5 videos mentioning quiz
7. ✅ Monitor Marketing tab daily

**Week 3: Optimize**
8. ✅ Identify best-performing content
9. ✅ Double down on winners
10. ✅ A/B test different CTAs

---

## 💡 TikTok Content Ideas

**Video Hooks That Work:**
1. "I created a quiz to see if YOU need better hearing..." (POV style)
2. "If you scored 70+ on this quiz, you NEED Soundbites..." (curiosity)
3. "My hearing quiz went viral... here's what I learned" (storytelling)
4. "This quiz will tell you if you're damaging your hearing" (fear/concern)
5. "Link in bio to test your hearing in 2 minutes" (direct CTA)

**Successful Quiz-to-Shop Funnel:**
1. TikTok Video → Quiz Link → Quiz Completion → High Score → TikTok Shop CTA → Purchase

---

## 📞 Support

Questions? Check the Marketing tab analytics or reach out!

**Resources:**
- TikTok Ads Manager: https://ads.tiktok.com
- TikTok Developer Portal: https://developers.tiktok.com
- TikTok Shop Seller Center: https://seller.tiktok.com

---

**Last Updated:** October 19, 2025
**Status:** Ready for Phase 1 implementation
