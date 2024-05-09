import { Token } from 'src/core/entities';

export interface TokenRepository {
	createToken(userID: number, refreshToken: string): Promise<Token>;
	getToken(userID: number): Promise<Token | null>;
	removeToken(refreshToken: string): Promise<void>;
}
