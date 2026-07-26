export const env = {
  port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/wedding_invitations',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
};
