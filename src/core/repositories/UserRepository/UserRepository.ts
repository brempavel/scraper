import { User } from 'src/core/entities';

export interface UserRepository {
	// /auth/sign-up
	createUser(userData: User): Promise<User>;
	getUser(email: string): Promise<User>;
}
