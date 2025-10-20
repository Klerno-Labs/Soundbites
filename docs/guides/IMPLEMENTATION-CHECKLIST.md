# ✅ TikTok Optimization Implementation Checklist

## 📋 Quick Start (2-3 Hours Total)

### Phase 1: Social Sharing (30 minutes)

#### Step 1: Create OG Image
- [ ] Go to Canva.com (free account)
- [ ] Create design: 1200 x 630 pixels
- [ ] Background: Gradient (#C92A76 to #6E49B2)
- [ ] Add text: "Do You Need Better Hearing?"
- [ ] Subtext: "Take Our Free 2-Minute Quiz"
- [ ] Include phone mockup showing quiz
- [ ] Download as `og-image.jpg`
- [ ] Upload to: `C:\Users\Somli\OneDrive\Desktop\Quiz\og-image.jpg`

#### Step 2: Update Meta Tags
- [ ] Open `index.html`
- [ ] Find lines 13-17 (current OG tags)
- [ ] Replace with content from `TIKTOK-META-TAGS.html`
- [ ] Change `https://yourdomain.com` to your actual URL
- [ ] Save file

---

### Phase 2: TikTok Pixel Setup (20 minutes)

#### Step 1: Get TikTok Pixel ID
- [ ] Go to https://ads.tiktok.com
- [ ] Sign in (create account if needed - free!)
- [ ] Click "Assets" → "Events"
- [ ] Click "Create Pixel"
- [ ] Name it: "Soundbites Quiz Pixel"
- [ ] Select "Manually Install Pixel Code"
- [ ] Copy your Pixel ID (format: C9XXXXXXXXXX)

#### Step 2: Install Pixel Code
- [ ] Open `index.html`
- [ ] Find line 25 (before `</head>`)
- [ ] Copy TikTok Pixel Code from `TIKTOK-META-TAGS.html` (lines 42-53)
- [ ] Replace `YOUR_TIKTOK_PIXEL_ID` with actual ID
- [ ] Save file

#### Step 3: Verify Pixel (After Deployment)
- [ ] Install "TikTok Pixel Helper" Chrome extension
- [ ] Visit your live quiz URL
- [ ] Check extension icon - should show green checkmark
- [ ] Should see "PageView" event fired

---

### Phase 3: Mobile Optimizations (25 minutes)

#### Step 1: Add Mobile Styles
- [ ] Open `Main app/styles.css`
- [ ] Scroll to bottom of file
- [ ] Copy ALL content from `TIKTOK-MOBILE-STYLES.css`
- [ ] Paste at end of `styles.css`
- [ ] Save file

#### Step 2: Add Loading Spinner
- [ ] Open `index.html`
- [ ] Find `<body>` tag (line 31)
- [ ] Add RIGHT AFTER `<body>`:
```html
<div id="app-loader" class="app-loader">
    <div class="loader-spinner"></div>
    <p>Loading your hearing assessment...</p>
</div>
```
- [ ] At end of `<body>` (before `</body>`), add:
```html
<script>
window.addEventListener('load', () => {
    const loader = document.getElementById('app-loader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 400);
    }
});
</script>
```
- [ ] Save file

---

### Phase 4: TikTok Event Tracking (30 minutes)

#### Step 1: Add Tracking Functions
- [ ] Open `Main app/script.js`
- [ ] Find the `SoundbiteQuiz` class (around line 3)
- [ ] After `constructor()` function, add:
```javascript
trackTikTokEvent(eventName, properties = {}) {
    if (window.ttq && typeof window.ttq.track === 'function') {
        try {
            window.ttq.track(eventName, properties);
            console.log('✅ TikTok Event:', eventName);
        } catch (error) {
            console.warn('TikTok Pixel error:', error);
        }
    }
}

captureUTMParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        source: params.get('utm_source') || 'direct',
        medium: params.get('utm_medium') || 'none',
        campaign: params.get('utm_campaign') || 'none'
    };
}
```

#### Step 2: Track Quiz Start
- [ ] Find `renderQuestion()` function
- [ ] Add after rendering first question (around line 120):
```javascript
if (this.currentQuestion === 0) {
    this.trackTikTokEvent('ViewContent', {
        content_type: 'quiz',
        content_name: 'Hearing Quiz Started'
    });
}
```

#### Step 3: Track Quiz Completion
- [ ] Find `submitQuiz()` function (around line 240)
- [ ] Add before `this.showResults()`:
```javascript
this.trackTikTokEvent('CompleteRegistration', {
    content_name: 'Quiz Completed',
    value: this.score / 100,
    currency: 'USD'
});
```

#### Step 4: Track Email Capture
- [ ] Find `sendResults()` function (around line 550)
- [ ] Add after email validation, before sending:
```javascript
this.trackTikTokEvent('SubmitForm', {
    content_name: 'Email Captured',
    value: 5.00,
    currency: 'USD'
});
```

---

### Phase 5: TikTok Shop Integration (20 minutes)

#### Step 1: Add TikTok Shop CTA
- [ ] Find `showResults()` function (around line 490)
- [ ] At the END of the function, before closing brace, add:

```javascript
// Add TikTok Shop CTA
const tiktokShopURL = 'YOUR_TIKTOK_SHOP_LINK_HERE'; // REPLACE THIS
const tiktokCTA = `
    <div class="tiktok-shop-cta">
        <h3>🎵 Ready to Improve Your Hearing?</h3>
        <p>Get Soundbites hearing solutions now!</p>
        <a href="${tiktokShopURL}?utm_source=quiz&utm_medium=results&utm_campaign=${this.recommendation}" 
           class="btn btn-primary" 
           target="_blank"
           onclick="if(window.ttq) ttq.track('ClickButton', {content_name: 'TikTok Shop', value: 10, currency: 'USD'});">
            🛒 Shop on TikTok
        </a>
    </div>
`;

const resultContent = document.getElementById('result-content');
resultContent.innerHTML += tiktokCTA;
```

- [ ] Replace `YOUR_TIKTOK_SHOP_LINK_HERE` with actual TikTok Shop URL
- [ ] Save file

---

### Phase 6: Deploy to Production (45 minutes)

#### Option A: Deploy with Vercel (Recommended)

**Prerequisites:**
- [ ] Have a GitHub account
- [ ] Install Git (if not already): https://git-scm.com/downloads
- [ ] Install Node.js (if not already): https://nodejs.org

**Steps:**
```powershell
# 1. Install Vercel CLI
npm install -g vercel

# 2. Navigate to your project
cd "C:\Users\Somli\OneDrive\Desktop\Quiz"

# 3. Initialize git (if not already)
git init
git add .
git commit -m "TikTok optimization complete"

# 4. Deploy to Vercel
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? soundbites-quiz
# - Directory? ./
# - Override settings? No

# 5. Get your production URL
vercel --prod
```

**Your URL will be:** `https://soundbites-quiz.vercel.app` (or custom domain)

#### Option B: Deploy with Netlify (Alternative)

- [ ] Go to https://netlify.com
- [ ] Sign up (free)
- [ ] Click "Add new site" → "Deploy manually"
- [ ] Drag your entire `Quiz` folder into the upload area
- [ ] Wait for deployment (2-3 minutes)
- [ ] Get your URL: `https://soundbites-quiz.netlify.app`

#### After Deployment:
- [ ] Update OG image URLs in `index.html` with your real domain
- [ ] Test TikTok Pixel with TikTok Pixel Helper extension
- [ ] Test quiz on real mobile device (iPhone & Android)
- [ ] Test TikTok Shop link works

---

### Phase 7: TikTok Setup (30 minutes)

#### Step 1: Add Quiz to TikTok Bio
- [ ] Open TikTok app
- [ ] Go to your profile
- [ ] Click "Edit Profile"
- [ ] In "Website" field, add:
```
https://your-quiz-url.com?utm_source=tiktok&utm_medium=bio&utm_campaign=profile
```
- [ ] Save

#### Step 2: Create First TikTok Video
**Video Ideas:**
- Show yourself taking the quiz
- Reveal your results
- Explain why hearing health matters
- Share surprising quiz insights

**Caption Template:**
```
I created a FREE hearing quiz 🎧

Find out if you need better hearing solutions in just 2 minutes! 

Results are personalized & instant ✨

Link in bio 👆 #hearinghealth #soundbites #tiktokshop
```

#### Step 3: Use UTM Links in Videos
When mentioning the quiz in videos, use unique UTM for each:

**Video 1 (Demo):**
```
?utm_source=tiktok&utm_medium=video&utm_campaign=demo-oct19
```

**Video 2 (Testimonial):**
```
?utm_source=tiktok&utm_medium=video&utm_campaign=testimonial-oct20
```

**TikTok Live:**
```
?utm_source=tiktok&utm_medium=livestream&utm_campaign=live-oct21
```

Then track performance in your Marketing tab!

---

## 🧪 Testing Checklist

### Before Going Live:
- [ ] Quiz loads on mobile (test on real phone)
- [ ] All buttons are tap-friendly (44px+ touch targets)
- [ ] Images load quickly (<3 seconds)
- [ ] TikTok Pixel fires (check with Pixel Helper)
- [ ] Quiz completion works
- [ ] Email capture works
- [ ] Results display correctly
- [ ] TikTok Shop link works
- [ ] UTM parameters are captured (check Marketing tab)

### Mobile Device Test:
- [ ] iPhone (Safari) ✓
- [ ] Android (Chrome) ✓
- [ ] Sliders work smoothly
- [ ] Radio buttons are easy to tap
- [ ] Text is readable (no zoom needed)
- [ ] Loading spinner shows
- [ ] Animations are smooth

### TikTok Pixel Test:
- [ ] Install TikTok Pixel Helper Chrome extension
- [ ] Visit your quiz URL
- [ ] Check PageView event fires
- [ ] Start quiz → Check ViewContent event fires
- [ ] Complete quiz → Check CompleteRegistration event fires
- [ ] Submit email → Check SubmitForm event fires
- [ ] Click Shop button → Check ClickButton event fires

---

## 📊 Monitor Performance

### Week 1: Check Daily
- [ ] Open Admin Panel → Marketing Tab
- [ ] Filter by `UTM Source = tiktok`
- [ ] Check:
  - How many visits from TikTok?
  - Conversion rate (quiz completion)
  - Email capture rate
  - Average score
  - High-need percentage

### Week 2: Optimize
- [ ] Identify best-performing TikTok campaign (highest conversion)
- [ ] Create more content like your winner
- [ ] Test different posting times (use Hour of Day chart)
- [ ] A/B test video hooks

### Week 3: Scale
- [ ] Double down on winning content type
- [ ] Consider TikTok Ads ($20/day minimum)
- [ ] Track ROI: Leads from TikTok → Sales on TikTok Shop
- [ ] Export quarterly data for analysis

---

## 🚨 Troubleshooting

**TikTok Pixel Not Firing?**
- Check if Pixel ID is correct in index.html
- Verify site is using HTTPS (not HTTP)
- Check browser console for errors
- Try in Incognito mode

**Quiz Not Loading on Mobile?**
- Clear browser cache
- Check internet connection
- Try different browser
- Verify deployment URL is correct

**UTM Parameters Not Tracking?**
- Check link format: `?utm_source=tiktok&utm_medium=bio`
- Verify backend is receiving parameters
- Check Marketing tab filters

**Low Conversion Rate?**
- Make quiz questions more engaging
- Shorten quiz (fewer questions)
- Improve TikTok video hook
- Test different CTAs

---

## 📈 Success Metrics

### Goals (After 1 Month):
- [ ] 1,000+ quiz completions from TikTok
- [ ] 15%+ email capture rate
- [ ] 20%+ high-need identification
- [ ] 5%+ TikTok Shop click-through
- [ ] 1%+ purchase conversion

### Track in Marketing Tab:
- Campaign Performance (which TikTok campaigns work best)
- Traffic Sources (TikTok vs other sources)
- Day of Week (best days to post)
- Hour of Day (best times to post)
- Conversion Funnel (where users drop off)

---

## 🎬 Next Steps After Implementation

### Immediate (Week 1):
1. Deploy quiz to production URL
2. Add link to TikTok bio
3. Post 3-5 TikTok videos mentioning quiz
4. Monitor Marketing tab daily

### Short-term (Weeks 2-4):
5. Optimize based on data (best campaigns, times, content)
6. Create TikTok-specific landing page variations
7. Test different quiz questions
8. A/B test TikTok Shop CTAs

### Long-term (Months 2-3):
9. Scale with TikTok Ads (if ROI positive)
10. Partner with TikTok influencers (give them unique UTM codes)
11. Create TikTok Shop exclusive offers
12. Build automated email sequences for leads

---

## 📞 Support Resources

**Documentation:**
- Full guide: `TIKTOK-OPTIMIZATION-GUIDE.md`
- Meta tags: `TIKTOK-META-TAGS.html`
- CSS styles: `TIKTOK-MOBILE-STYLES.css`
- Tracking code: `TIKTOK-TRACKING-CODE.js`

**TikTok Resources:**
- TikTok Ads Manager: https://ads.tiktok.com
- TikTok Pixel Helper: Chrome extension
- TikTok Shop Seller: https://seller.tiktok.com
- TikTok Developer: https://developers.tiktok.com

**Deployment:**
- Vercel Docs: https://vercel.com/docs
- Netlify Docs: https://docs.netlify.com

---

## ✅ Final Pre-Launch Checklist

Before sharing quiz on TikTok:
- [ ] OG image created (1200x630px)
- [ ] Meta tags updated with OG image URL
- [ ] TikTok Pixel installed with real ID
- [ ] Mobile styles added
- [ ] Loading spinner implemented
- [ ] Event tracking code added (ViewContent, CompleteRegistration, SubmitForm)
- [ ] TikTok Shop CTA added to results
- [ ] Deployed to production URL (not localhost!)
- [ ] Tested on mobile devices
- [ ] TikTok Pixel verified with extension
- [ ] UTM parameters working
- [ ] Marketing tab tracking correctly
- [ ] Quiz link added to TikTok bio
- [ ] First TikTok video posted

**Estimated Time:** 2-3 hours total
**Difficulty:** Medium (copy-paste, some customization)
**Impact:** High (TikTok-optimized, trackable, scalable)

---

**🎉 You're ready to go viral on TikTok!**

**Questions?** Check the detailed guides in your Quiz folder or test everything in the Marketing tab.
