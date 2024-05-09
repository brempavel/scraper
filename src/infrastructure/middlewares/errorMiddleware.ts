import { NextFunction, Request, Response } from 'express';

import { ApiError } from '../errors/ApiError';

export function errorMiddleware(
	err: Error,
	req: Request,
	res: Response,
	next: NextFunction
) {
	if (err instanceof ApiError) {
		return res
			.status(err.status)
			.json({ message: err.message, errors: err.errors });
	}
	return res.status(500).json({
		error: `Unexpected error happen: ${err.name}`,
		message: err.message,
	});
}
