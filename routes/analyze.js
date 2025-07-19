
const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

async function analyzeURL(targetUrl, userAgent) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  if (userAgent) {
    await page.setUserAgent(userAgent);
  }

  const redirects = [];
  page.on('request', request => {
    redirects.push(request.url());
  });

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    const content = await page.content();
    const finalUrl = page.url();

    return { finalUrl, redirects, html: content };
  } catch (err) {
    return { error: err.message };
  } finally {
    await browser.close();
  }
}

router.get('/', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'URL é obrigatória' });
  }

  try {
    const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';
    const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.2 Mobile/15E148 Safari/604.1';

    const [desktop, mobile] = await Promise.all([
      analyzeURL(url, desktopUA),
      analyzeURL(url, mobileUA)
    ]);

    res.json({
      input: url,
      desktop: {
        finalUrl: desktop.finalUrl,
        redirects: desktop.redirects
      },
      mobile: {
        finalUrl: mobile.finalUrl,
        redirects: mobile.redirects
      },
      cloakingDetected: desktop.finalUrl !== mobile.finalUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
