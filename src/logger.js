import pino from 'pino';

const level = process.env.LOG_LEVEL || 'info';
const pretty = (process.env.PRETTY_LOGS || '').toLowerCase() === 'true';
const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';

const transport = (!isProd && pretty)
  ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    }
  : undefined;

export const logger = pino({ level, transport });
