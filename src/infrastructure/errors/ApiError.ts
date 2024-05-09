export class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
		public errors: string[] = []
	) {
		super(message);
	}

	static UnauthorizedError() {
		return new ApiError(401, 'The user is not authorized');
	}

	static BadRequest(message: string, errors: string[] = []) {
		return new ApiError(400, message, errors);
	}

	static InternalServerError(message: string, errors: string[] = []) {
		return new ApiError(500, message, errors);
	}
}
