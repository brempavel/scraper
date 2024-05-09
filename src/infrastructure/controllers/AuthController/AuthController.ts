import { Request, Response, NextFunction } from 'express';
import { bodyValidator, controller, post, get } from '../../decorators';
import { PostgresUserRepository } from '../../db/postgres/PostgresUserRepository';
import { PostgresTokenRepository } from '../../db/postgres/PostgresTokenRepository';
import { TokenService, UserService } from '../../../core/services';
import { ApiError } from '../../errors/ApiError';
import { validateUser } from './utils';
import bcrypt from 'bcrypt';

@controller('/auth')
class AuthController {
	@post('/sign-up')
	@bodyValidator('email', 'password')
	async signUp(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const userData = req.body;

			const errors = validateUser(userData);
			if (errors.length > 0) {
				throw ApiError.BadRequest('Invalid user data', errors);
			}

			const userService = new UserService(new PostgresUserRepository());
			const { password, ...userDto } = await userService.createUser(userData);

			const tokenService = new TokenService(new PostgresTokenRepository());
			const { accessToken, refreshToken } = tokenService.generateTokens({
				...userDto,
			});
			await tokenService.createToken(userDto.id, refreshToken);

			res.cookie('refreshToken', refreshToken, {
				maxAge: 30 * 24 * 60 * 60 * 1000,
				httpOnly: true,
			});
			res.json({ accessToken, refreshToken, user: userDto });
		} catch (e) {
			next(e);
		}
	}

	@post('/login')
	@bodyValidator('email', 'password')
	async login(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const userData = req.body;

			const errors = validateUser(userData);
			if (errors.length > 0) {
				throw ApiError.BadRequest('Invalid user data', errors);
			}

			const userService = new UserService(new PostgresUserRepository());
			const { password, ...userDto } = await userService.getUser(
				userData.email
			);

			const isPassEquals = await bcrypt.compare(userData.password, password);
			if (!isPassEquals) {
				throw ApiError.BadRequest('Password is not valid');
			}

			const tokenService = new TokenService(new PostgresTokenRepository());
			const { accessToken, refreshToken } = tokenService.generateTokens({
				...userDto,
			});
			await tokenService.createToken(userDto.id, refreshToken);

			res.cookie('refreshToken', refreshToken, {
				maxAge: 30 * 24 * 60 * 60 * 1000,
				httpOnly: true,
			});
			res.json({ accessToken, refreshToken, user: userDto });
		} catch (e) {
			next(e);
		}
	}

	@post('/logout')
	async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const { refreshToken } = req.cookies;

			const tokenService = new TokenService(new PostgresTokenRepository());
			await tokenService.removeToken(refreshToken);

			res.clearCookie('refreshToken');
			res.sendStatus(200);
		} catch (e) {
			next(e);
		}
	}

	@get('/refresh')
	async refresh(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const { refreshToken } = req.cookies;
			if (!refreshToken) {
				throw ApiError.UnauthorizedError();
			}

			const tokenService = new TokenService(new PostgresTokenRepository());
			const userData = tokenService.validateRefreshToken(refreshToken);
			const tokenFromDb = await tokenService.getToken(userData.id);
			if (!userData || !tokenFromDb) {
				throw ApiError.UnauthorizedError();
			}

			const userService = new UserService(new PostgresUserRepository());
			const { password, ...userDto } = await userService.getUser(
				userData.email
			);
			const tokens = tokenService.generateTokens(userDto);

			res.cookie('refreshToken', refreshToken, {
				maxAge: 30 * 24 * 60 * 60 * 1000,
				httpOnly: true,
			});
			res.json({ ...tokens, user: userDto });
		} catch (e) {
			next(e);
		}
	}
}
