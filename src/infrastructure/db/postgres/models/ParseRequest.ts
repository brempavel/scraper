import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ParseRequest {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	email: string;
}
