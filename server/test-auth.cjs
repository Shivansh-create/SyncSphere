const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'nonexistent999@test.com',
      password: 'password123'
    });
    console.log("LOGIN SUCCESS:", res.data);
  } catch (err) {
    console.log("LOGIN FAILED:", err.response?.status, err.response?.data);
  }

  try {
    const res = await axios.post('http://localhost:3001/api/auth/login-secure', {
      email: 'nonexistent999@test.com',
      password: 'password123'
    });
    console.log("LOGIN-SECURE SUCCESS:", res.data);
  } catch (err) {
    console.log("LOGIN-SECURE FAILED:", err.response?.status, err.response?.data);
  }
}

test();
