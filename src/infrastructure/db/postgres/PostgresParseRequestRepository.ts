import AppDataSource from './AppDataSource';
import { ParseRequest } from '../../../core/entities';
import { ParseRequestRepository } from '../../../core/repositories';
import { ParseRequest as ParseRequestModel } from './models/ParseRequest';

export class PostgresParseRequestRepository implements ParseRequestRepository {
	private parseRequestRepository =
		AppDataSource.getRepository(ParseRequestModel);

	async addUser(email: string): Promise<ParseRequest> {
		const candidate = await this.parseRequestRepository.findOneBy({ email });
		if (candidate) {
			console.log(`User with email: ${email} already in list`);
			return candidate;
		}

		const parseRequest = await this.parseRequestRepository.save({ email });
		return parseRequest;
	}

	async getUserEmails(): Promise<string[]> {
		const users = await this.parseRequestRepository.find();
		return users.map((user) => user.email);
	}
}
