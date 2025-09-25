document.getElementById('login-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const errorDiv = document.getElementById('login-error');
  errorDiv.textContent = '';

  try {
    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok && data.token) {
      localStorage.setItem('jwt', data.token);
      window.location.href = 'index.html';
    } else {
      errorDiv.textContent = data.error || 'Login failed';
    }
  } catch (err) {
    errorDiv.textContent = 'Network error';
  }
});

document.getElementById('register-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const fullName = document.getElementById('register-fullname').value;
  const email = document.getElementById('register-email').value;
  const username = document.getElementById('register-username').value;
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm-password').value;
  const errorDiv = document.getElementById('register-error');
  const successDiv = document.getElementById('register-success');
  errorDiv.textContent = '';
  successDiv.textContent = '';

  if (!fullName || !email || !username || !password || !confirmPassword) {
    errorDiv.textContent = 'All fields are required.';
    return;
  }
  if (password !== confirmPassword) {
    errorDiv.textContent = 'Passwords do not match.';
    return;
  }

  try {
    const res = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, username, password, confirmPassword })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      successDiv.textContent = 'Registration successful! You can now log in.';
    } else {
      errorDiv.textContent = data.error || 'Registration failed';
    }
  } catch (err) {
    errorDiv.textContent = 'Network error';
  }
});
