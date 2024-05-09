import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../errors/ApiError';
import { TokenService } from '../../core/services';
import { PostgresTokenRepository } from '../db/postgres/PostgresTokenRepository';
import { User } from '../../core/entities';

export function authMiddleware(
	req: Request & { user: Omit<User, 'password'> },
	res: Response,
	next: NextFunction
) {
	try {
		const authorizationHeader = req.headers.authorization;
		if (!authorizationHeader) throw ApiError.UnauthorizedError();

		const accessToken = authorizationHeader.split(' ')[1];
		if (!accessToken) throw ApiError.UnauthorizedError();

		const tokenService = new TokenService(new PostgresTokenRepository());
		const userData = tokenService.validateAccessToken(accessToken);
		if (!userData) throw ApiError.UnauthorizedError();

		req.user = userData;
		next();
	} catch (e) {
		next(e);
	}
}
