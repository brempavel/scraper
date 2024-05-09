import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './User';

@Entity()
export class Token {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	token: string;

	@OneToOne(() => User, (user) => user.token, { onDelete: 'CASCADE' })
	user: User;
}
