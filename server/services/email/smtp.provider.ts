import nodemailer from 'nodemailer';

let cachedTransporter: nodemailer.Transporter | null = null;

export const createSmtpTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = (process.env.EMAIL_HOST || '').trim();
  const port = parseInt(process.env.EMAIL_PORT || '465', 10);
  const secure = port === 465;

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: 5000, // 5s connection timeout
    greetingTimeout: 5000,   // 5s greeting timeout
    socketTimeout: 8000,     // 8s socket timeout
    auth: {
      user: (process.env.EMAIL_USER || '').trim(),
      pass: (process.env.EMAIL_PASSWORD || '').trim()
    }
  });

  return cachedTransporter;
};

export const getFromAddress = () => {
  return (process.env.EMAIL_FROM || process.env.EMAIL_USER || 'info@jadmaa.com').trim();
};
