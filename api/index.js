module.exports = (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Routes
  if (req.url === '/api/health' && req.method === 'GET') {
    res.status(200).end(JSON.stringify({ status: 'ok', message: 'Backend is running!' }));
    return;
  }

  if (req.url === '/api/auth/register' && req.method === 'POST') {
    res.status(201).end(JSON.stringify({ message: 'Register endpoint' }));
    return;
  }

  if (req.url === '/api/auth/login' && req.method === 'POST') {
    res.status(200).end(JSON.stringify({ message: 'Login endpoint' }));
    return;
  }

  if (req.url === '/api/auth/refresh' && req.method === 'POST') {
    res.status(200).end(JSON.stringify({ message: 'Refresh token endpoint' }));
    return;
  }

  if (req.url === '/api/auth/logout' && req.method === 'POST') {
    res.status(200).end(JSON.stringify({ message: 'Logout endpoint' }));
    return;
  }

  if (req.url === '/api/restaurants' && req.method === 'GET') {
    res.status(200).end(JSON.stringify({ message: 'Get restaurants' }));
    return;
  }

  if (req.url === '/api/restaurants' && req.method === 'POST') {
    res.status(201).end(JSON.stringify({ message: 'Create restaurant' }));
    return;
  }

  if (req.url === '/api/reviews' && req.method === 'GET') {
    res.status(200).end(JSON.stringify({ message: 'Get reviews' }));
    return;
  }

  if (req.url === '/api/reviews' && req.method === 'POST') {
    res.status(201).end(JSON.stringify({ message: 'Create review' }));
    return;
  }

  if (req.url.startsWith('/api/users/') && req.method === 'GET') {
    res.status(200).end(JSON.stringify({ message: 'Get user' }));
    return;
  }

  if (req.url.startsWith('/api/users/') && req.method === 'PUT') {
    res.status(200).end(JSON.stringify({ message: 'Update user' }));
    return;
  }

  // 404
  res.status(404).end(JSON.stringify({ error: 'Route not found' }));
};
