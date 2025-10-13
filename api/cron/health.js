export default async function handler(req, res) {
  return res.status(200).json({
    status: 'ok',
    message: 'Cron API server running',
    timestamp: new Date().toISOString(),
  });
}
