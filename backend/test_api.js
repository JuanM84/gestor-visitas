const http = require('http');

const data = JSON.stringify({ email: 'admin@tunel.gov.ar', password: 'admin123' });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => { body += d; });
  res.on('end', () => {
    const token = JSON.parse(body).token;
    console.log('Got token:', !!token);
    
    // Now request usuarios
    const req2 = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/usuarios',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    }, res2 => {
      let body2 = '';
      res2.on('data', d => { body2 += d; });
      res2.on('end', () => {
        console.log('Status:', res2.statusCode);
        console.log('Body:', body2);
      });
    });
    req2.end();
  });
});

req.on('error', error => { console.error(error); });
req.write(data);
req.end();
