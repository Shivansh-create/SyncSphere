const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:3001/api/auth/register-secure', {
      email: 'newfake99@test.com',
      password: 'password123'
    });
    console.log("REGISTER-SECURE SUCCESS:", res.data);
  } catch (err) {
    console.log("REGISTER-SECURE FAILED:", err.response?.status, err.response?.data);
  }
}

test();
