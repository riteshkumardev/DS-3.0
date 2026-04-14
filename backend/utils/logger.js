// logger.js
import winston from 'winston';
import 'winston-daily-rotate-file';

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf((info) => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
);

// Configuration for daily log rotation (Purane logs delete hote rahenge automatically)
const dailyRotateFileTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m', // Ek file max 20MB ki hogi
    maxFiles: '14d', // 14 din ke baad purane logs delete ho jayenge
});

const logger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        dailyRotateFileTransport,
        // Error logs ko ek alag file mein bhi save karenge
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            format: logFormat 
        }),
    ],
});

// Agar development mode mein hain, toh console par bhi print karein colors ke saath
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
    }));
}

export default logger;