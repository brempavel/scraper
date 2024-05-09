import { Token, User } from '../../../core/entities';
import { UserRepository } from '../../../core/repositories';
import AppDataSource from './AppDataSource';
import { User as UserModel } from './models/User';
import { ApiError } from '../../errors/ApiError';
import bcrypt from 'bcrypt';

export class PostgresUserRepository implements UserRepository {
	private userRepository = AppDataSource.getRepository(UserModel);

	async createUser({ email, password }: User): Promise<User> {
		const candidate = await this.userRepository.findOneBy({ email });
		if (candidate) {
			throw ApiError.BadRequest(`User with email: ${email} already exists`);
		}

		const passwordHash = await bcrypt.hash(password, 3);
		const user = await this.userRepository.save({
			email,
			password: passwordHash,
		});
		return user;
	}

	async getUser(email: string): Promise<User> {
		const user = await this.userRepository.findOneBy({ email });
		if (!user) {
			throw ApiError.BadRequest(`User with email: ${email} does not exist`);
		}
		return user;
	}
}
