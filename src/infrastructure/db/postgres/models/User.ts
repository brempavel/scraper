import {
	Column,
	Entity,
	JoinColumn,
	OneToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Token } from './Token';

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	email: string;

	@Column()
	password: string;

	@OneToOne(() => Token, (token) => token.user, { onDelete: 'SET NULL' })
	@JoinColumn()
	token: Token;
}
