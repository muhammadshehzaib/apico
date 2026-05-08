import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.config';
import { swaggerSpec } from './config/swagger.config';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { requestIdMiddleware } from './middleware/requestId.middleware';
import { globalLimiter } from './middleware/rateLimiter.middleware';
import { error as errorResponse } from './utils/response.util';
import logger from './utils/logger';

const app = express();

app.use(requestIdMiddleware);
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));
app.use(cookieParser());

if (env.NODE_ENV !== 'test') {
  app.use(pinoHttp({
    logger,
    genReqId: (req) => req.requestId,
    customLogLevel: (_req, res) => res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
    serializers: {
      req: (req) => ({ method: req.method, url: req.url, id: req.id }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  }));
}

app.use(globalLimiter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/v1', routes);

app.use((req, res) => {
  errorResponse(res, 'Route not found', 404);
});

app.use(errorHandler);

export default app;
