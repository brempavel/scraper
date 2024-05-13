import { Request, Response, NextFunction } from 'express';
import Papa from 'papaparse';
import { controller, get, use } from '../../decorators';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { User } from '../../../core/entities';
import { createGoogleSpreadsheet, scrapeData } from './utils';
import { ParseRequestService } from '../../../core/services';
import { PostgresParseRequestRepository } from '../../db/postgres/PostgresParseRequestRepository';
import { ApiError } from '../../errors/ApiError';

@controller('')
export class ParseController {
	@get('/parse')
	@use(authMiddleware)
	async parse(
		req: Request & { user: Omit<User, 'password'> },
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const { email } = req.user;

			if (!email) {
				throw ApiError.UnauthorizedError();
			}

			const parseRequestService = new ParseRequestService(
				new PostgresParseRequestRepository()
			);
			await parseRequestService.addUser(email);

			const { format } = req.query;
			const jsonData = await scrapeData();

			switch (format) {
				case 'json':
					const jsonString = JSON.stringify(jsonData);
					res.setHeader(
						'Content-Disposition',
						'attachment; filename=data.json'
					);
					res.setHeader('Content-Type', 'application/json');
					res.send(jsonString);
					break;
				case 'csv':
					const csv = Papa.unparse(jsonData);
					res.setHeader('Content-Disposition', 'attachment; filename=data.csv');
					res.setHeader('Content-Type', 'text/csv');
					res.send(csv);
					break;
				case 'gsheet':
					const spreadsheetURL = await createGoogleSpreadsheet(jsonData);
					res.send(spreadsheetURL);
					break;
				default:
					throw ApiError.BadRequest('Invalid requested format');
			}
		} catch (e) {
			next(e);
		}
	}

	@get('/parse-requests')
	async getParseRequests(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const parseRequestService = new ParseRequestService(
				new PostgresParseRequestRepository()
			);
			const users = await parseRequestService.getUsers();

			res.json(users);
		} catch (e) {
			next(e);
		}
	}
}
