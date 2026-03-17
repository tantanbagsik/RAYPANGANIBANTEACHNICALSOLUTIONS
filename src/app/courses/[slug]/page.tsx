const data = await res.json();

if (data.free) {
  router.push('/dashboard'); // free course → go to dashboard
  return;
}

if (data.url) {
  window.location.href = data.url; // paid → go to Stripe
}
