const axios = require('axios');

const API = process.env.VITE_API_URL ? `${process.env.VITE_API_URL}/api` : 'http://localhost:3001/api';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function poll() {
  while (true) {
    try {
      const [catsRes, prodsRes] = await Promise.all([
        axios.get(`${API}/categories`),
        axios.get(`${API}/products`),
      ]);
      console.log('[API-LOG] categories:', Array.isArray(catsRes.data) ? catsRes.data.length : typeof catsRes.data);
      console.log('[API-LOG] products:', Array.isArray(prodsRes.data) ? prodsRes.data.length : typeof prodsRes.data);
    } catch (err) {
      console.error('[API-LOG] request error:', err.message || err);
    }
    await delay(5000);
  }
}

poll();
