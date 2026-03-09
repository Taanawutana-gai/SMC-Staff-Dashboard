import https from 'https';

function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchData(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          console.log('Raw data:', data.substring(0, 100));
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function checkData() {
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbyvRUhqBoxy7NuozelXiI2azcpSo0pwI7A8TJJfMNZEt-mwVtq8Z7QvXD-5m-aVGu9LyA/exec?action=getData';
  try {
    const data = await fetchData(GAS_URL);
    console.log('Employees Header:', data.employees[0]);
    console.log('Employees First Row:', data.employees[1]);
  } catch (e) {
    console.error(e);
  }
}

checkData();
