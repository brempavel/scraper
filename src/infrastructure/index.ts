import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import { AppRouter } from './AppRouter';
import { errorMiddleware } from './middlewares/errorMiddleware';

import './controllers/AuthController/AuthController';
import './controllers/ParseController/ParseController';

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(AppRouter.getInstance());
app.use(errorMiddleware);

(() => {
	try {
		dotenv.config();
		const PORT = process.env.PORT;

		app.listen(PORT, () => {
			console.log(`Listening on port ${PORT}`);
		});
	} catch (e) {
		console.log(e);
	}
})();
