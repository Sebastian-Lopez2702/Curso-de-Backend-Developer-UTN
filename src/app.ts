import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './config/swagger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { categoryRouter } from './routes/categoryRoute';
import { orderRouter } from './routes/orderRoute';
import { productRouter } from './routes/productRoute';
import { provinceRouter } from './routes/provinceRoute';
import { userRouter } from './routes/userRoute';
import { successResponse } from './utils/apiResponse';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.json(successResponse({ status: 'ok' }, 'API E-commerce UTN funcionando'));
});

// Inicio Documentación Swagger
const customCss = `
  .swagger-ui .auth-wrapper { display: none !important; }
  .swagger-ui .response-col_links { display: none !important; }
  .swagger-ui .servers { display: none !important; }
  .swagger-ui .response-control-media-type { display: none !important; }
  .swagger-ui section.models h4 span { font-size: 0; }
  .swagger-ui section.models h4 span::after { content: 'Modelos de Respuesta'; font-size: 1.25rem; font-weight: 700; }
`;

const swaggerSetup = swaggerUi.setup(swaggerDocument, {
  customCss,
  swaggerOptions: {
    supportedSubmitMethods: [],
  },
}) as unknown as express.RequestHandler;

app.use('/api/docs', ...(swaggerUi.serve as unknown as express.RequestHandler[]), swaggerSetup);
// Fin Documentación Swagger

app.use('/api/users', userRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/products', productRouter);
app.use('/api/provinces', provinceRouter);
app.use('/api/orders', orderRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
