import winston from 'winston';
import 'winston-daily-rotate-file';

// Check if running on Vercel or Production
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf((info) => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
);

const transports = [];

// 1. Always add Console Transport (Best for Vercel/Docker)
transports.push(
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
    })
);

// 2. Add File Transports ONLY if NOT in Production/Vercel
if (!isProduction) {
    // Configuration for daily log rotation
    transports.push(
        new winston.transports.DailyRotateFile({
            filename: 'logs/application-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: logFormat
        })
    );

    // Error logs specific file
    transports.push(
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            format: logFormat 
        })
    );
}

const logger = winston.createLogger({
    level: isProduction ? 'info' : 'debug',
    format: logFormat,
    transports: transports,
});

export default logger;