const express = require('express');
const morgan = require('morgan');

const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

//MIDDLEWARE
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json());

app.use((req, res, next) => {
  console.log('Hello from the middleware 👋');
  next();
});

//ROUTES
app.use('/api/v1/users', userRouter);

//Global Error Handler

app.all('*', (req, res, next) => {
  return next(new AppError(`Can't find ${req.originalUrl} at this server`));
});

app.use(globalErrorHandler);
module.exports = app;
