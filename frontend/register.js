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
  const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, username, password, confirmPassword })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      successDiv.textContent = 'Registration successful! Redirecting to login...';
      setTimeout(() => { window.location.href = 'login.html'; }, 1500);
    } else {
      errorDiv.textContent = data.error || 'Registration failed';
    }
  } catch (err) {
    errorDiv.textContent = 'Network error';
  }
});
