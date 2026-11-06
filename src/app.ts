import express, { Request, Response } from 'express';
import cors from 'cors';
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

app.use('/api/users', userRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/products', productRouter);
app.use('/api/provinces', provinceRouter);
app.use('/api/orders', orderRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
