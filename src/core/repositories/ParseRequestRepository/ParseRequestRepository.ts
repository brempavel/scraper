import { ParseRequest, User } from 'src/core/entities';

export interface ParseRequestRepository {
	// /parse
	addUser(email: string): Promise<ParseRequest>;
	// /parse-requests
	getUserEmails(): Promise<string[]>;
}
