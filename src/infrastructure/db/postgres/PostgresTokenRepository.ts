import { Token } from '../../../core/entities';
import { TokenRepository } from '../../../core/repositories';
import { Token as TokenModel } from './models/Token';
import { User as UserModel } from './models/User';
import AppDataSource from './AppDataSource';

export class PostgresTokenRepository implements TokenRepository {
	private tokenRepository = AppDataSource.getRepository(TokenModel);

	async createToken(userID: number, refreshToken: string): Promise<Token> {
		let token = await this.tokenRepository.findOne({
			where: { user: { id: userID } },
		});

		if (token) {
			token.token = refreshToken;
		} else {
			token = this.tokenRepository.create({
				token: refreshToken,
				user: { id: userID },
			});
		}

		return this.tokenRepository.save(token);
	}

	async getToken(userID: number): Promise<Token | null> {
		const token = await this.tokenRepository.findOne({
			where: { user: { id: userID } },
		});
		return token ? token : null;
	}

	async removeToken(refreshToken: string): Promise<void> {
		const token = await this.tokenRepository.findOneBy({ token: refreshToken });

		if (!token) {
			console.log('Token not found');
			return;
		}

		await this.tokenRepository.remove(token);
		return;
	}
}
