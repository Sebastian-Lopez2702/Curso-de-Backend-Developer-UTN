import express, { Request, Response } from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { categoryRouter } from './routes/categoryRoute';
import { productRouter } from './routes/productRoute';
import { userRouter } from './routes/userRoute';
import { successResponse } from './utils/apiResponse';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.json(successResponse({ status: 'ok' }, 'API E-commerce UTN funcionando'));
});

app.use('/api/users', userRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/products', productRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
