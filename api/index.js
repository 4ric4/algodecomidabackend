const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

// Auth endpoints
app.post('/api/auth/register', (req, res) => {
  res.status(201).json({ message: 'Register endpoint' });
});

app.post('/api/auth/login', (req, res) => {
  res.json({ message: 'Login endpoint' });
});

app.post('/api/auth/refresh', (req, res) => {
  res.json({ message: 'Refresh endpoint' });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logout endpoint' });
});

// Restaurant endpoints
app.get('/api/restaurants', (req, res) => {
  res.json({ message: 'Get restaurants' });
});

app.post('/api/restaurants', (req, res) => {
  res.json({ message: 'Create restaurant' });
});

// Review endpoints
app.get('/api/reviews', (req, res) => {
  res.json({ message: 'Get reviews' });
});

app.post('/api/reviews', (req, res) => {
  res.json({ message: 'Create review' });
});

// User endpoints
app.get('/api/users/:id', (req, res) => {
  res.json({ message: 'Get user' });
});

app.put('/api/users/:id', (req, res) => {
  res.json({ message: 'Update user' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Server error' });
});

// Export para Vercel serverless
module.exports = serverless(app);
