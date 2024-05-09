import { ParseRequest, User } from 'src/core/entities';
import { ParseRequestRepository } from 'src/core/repositories';

export class ParseRequestService {
	constructor(readonly parseRequestRepository: ParseRequestRepository) {}

	addUser(email: string): Promise<ParseRequest> {
		return this.parseRequestRepository.addUser(email);
	}

	getUsers(): Promise<string[]> {
		return this.parseRequestRepository.getUserEmails();
	}
}
