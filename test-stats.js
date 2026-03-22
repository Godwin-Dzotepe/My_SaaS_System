const http = require('http');

async function check() {
  const res = await fetch('http://localhost:3000/api/dashboard/stats');
  console.log(res.status);
  const text = await res.text();
  console.log(text);
}
check();
