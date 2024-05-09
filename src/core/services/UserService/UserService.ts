import { User } from 'src/core/entities';
import { UserRepository } from 'src/core/repositories';

export class UserService {
	constructor(readonly userRepository: UserRepository) {}

	createUser(userData: User): Promise<User> {
		return this.userRepository.createUser(userData);
	}

	getUser(email: string): Promise<User> {
		return this.userRepository.getUser(email);
	}
}
