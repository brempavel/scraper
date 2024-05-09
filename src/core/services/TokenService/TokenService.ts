import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

import { Token, User } from 'src/core/entities';
import { TokenRepository } from 'src/core/repositories';

export class TokenService {
	constructor(readonly tokenRepository: TokenRepository) {
		dotenv.config();
	}

	createToken(userID: number, refreshToken: string): Promise<Token> {
		return this.tokenRepository.createToken(userID, refreshToken);
	}

	getToken(userID: number): Promise<Token | null> {
		return this.tokenRepository.getToken(userID);
	}

	removeToken(refreshToken: string): Promise<void> {
		return this.tokenRepository.removeToken(refreshToken);
	}

	generateTokens(user: Omit<User, 'password'>) {
		const accessToken = jwt.sign(user, process.env.JWT_ACCESS_SECRET, {
			expiresIn: '30m',
		});
		const refreshToken = jwt.sign(user, process.env.JWT_REFRESH_SECRET, {
			expiresIn: '30d',
		});

		return {
			accessToken,
			refreshToken,
		};
	}

	validateAccessToken(token: string): Omit<User, 'password'> | null {
		try {
			const { id, email } = jwt.verify(
				token,
				process.env.JWT_ACCESS_SECRET
			) as Omit<User, 'password'>;
			return { id, email };
		} catch (e) {
			return null;
		}
	}

	validateRefreshToken(token: string): Omit<User, 'password'> | null {
		try {
			const { id, email } = jwt.verify(
				token,
				process.env.JWT_REFRESH_SECRET
			) as Omit<User, 'password'>;
			return { id, email };
		} catch (e) {
			return null;
		}
	}
}
