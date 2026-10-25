const token = localStorage.getItem('tok') || sessionStorage.getItem('tok') || '';
const form = document.querySelector('#passwordForm');
const message = document.querySelector('#passwordMessage');

if (!token) {
  window.location.replace('/');
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(form);
  const currentPassword = data.get('currentPassword');
  const newPassword = data.get('newPassword');
  if (newPassword !== data.get('confirmPassword')) {
    message.textContent = 'New passwords do not match.';
    return;
  }
  const response = await fetch('/api/admin/password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-token': token },
    body: JSON.stringify({ currentPassword, newPassword })
  });
  const result = await response.json();
  if (!response.ok) {
    message.textContent = result.error || 'Could not change password.';
    if (response.status === 401) window.location.replace('/');
    return;
  }
  form.reset();
  message.textContent = 'Password changed successfully.';
});
