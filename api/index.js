export default function handler(req, res) {
  try {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    // OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Remove query params da URL
    const url = req.url.split('?')[0];

    // HEALTH
    if (url === '/api/health' && req.method === 'GET') {
      return res.status(200).json({
        status: 'ok',
        message: 'Backend is running!'
      });
    }

    // AUTH
    if (url === '/api/auth/register' && req.method === 'POST') {
      return res.status(201).json({ message: 'Register endpoint' });
    }

    if (url === '/api/auth/login' && req.method === 'POST') {
      return res.status(200).json({ message: 'Login endpoint' });
    }

    if (url === '/api/auth/refresh' && req.method === 'POST') {
      return res.status(200).json({ message: 'Refresh token endpoint' });
    }

    if (url === '/api/auth/logout' && req.method === 'POST') {
      return res.status(200).json({ message: 'Logout endpoint' });
    }

    // RESTAURANTS
    if (url === '/api/restaurants' && req.method === 'GET') {
      return res.status(200).json({ message: 'Get restaurants' });
    }

    if (url === '/api/restaurants' && req.method === 'POST') {
      return res.status(201).json({ message: 'Create restaurant' });
    }

    // REVIEWS
    if (url === '/api/reviews' && req.method === 'GET') {
      return res.status(200).json({ message: 'Get reviews' });
    }

    if (url === '/api/reviews' && req.method === 'POST') {
      return res.status(201).json({ message: 'Create review' });
    }

    // USERS (dinâmico)
    if (url.startsWith('/api/users/') && req.method === 'GET') {
      return res.status(200).json({ message: 'Get user' });
    }

    if (url.startsWith('/api/users/') && req.method === 'PUT') {
      return res.status(200).json({ message: 'Update user' });
    }

    // 404
    return res.status(404).json({ error: 'Route not found' });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}