import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.config';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { error as errorResponse } from './utils/response.util';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api', routes);

app.use((req, res) => {
  errorResponse(res, 'Route not found', 404);
});

app.use(errorHandler);

export default app;
