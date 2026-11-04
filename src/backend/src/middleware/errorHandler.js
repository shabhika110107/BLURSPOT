const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  console.error('Error stack:', err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (err.code === 'ResourceNotFoundException') {
    return res.status(404).json({ error: 'Resource not found' });
  }

  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error'
  });
};

module.exports = { errorHandler };
