(async () => {
  try {
    const urls = ['https://digi-kaufvertrag-production.up.railway.app', 'https://digi-kaufvertrag-production.up.railway.app/api/health'];
    for (const url of urls) {
      const res = await fetch(url, { method: 'GET' });
      console.log('\n---');
      console.log('URL:', url);
      console.log('Status:', res.status);
      const headers = {};
      res.headers.forEach((v,k)=> headers[k]=v);
      console.log('Headers:', headers);
      const text = await res.text();
      console.log('Body (first 500 chars):', text.slice(0,500).replace(/\n/g,' '));
    }

    // Check CORS preflight (OPTIONS) to /api/health
    const opt = await fetch('https://digi-kaufvertrag-production.up.railway.app/api/health', { method: 'OPTIONS' });
    console.log('\n---');
    console.log('OPTIONS /api/health status:', opt.status);
    const optHeaders = {};
    opt.headers.forEach((v,k)=> optHeaders[k]=v);
    console.log('OPTIONS headers:', optHeaders);
  } catch (err) {
    console.error('Error fetching:', err);
  }
})();
