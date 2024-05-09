import { DataSource } from 'typeorm';
import { User } from './models/User';
import { ParseRequest } from './models/ParseRequest';
import { Token } from './models/Token';
import dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
	type: 'postgres',
	host: 'db',
	// host: 'localhost',
	port: Number(process.env.DB_PORT),
	username: process.env.POSTGRES_USER,
	password: process.env.POSTGRES_PASSWORD,
	database: process.env.POSTGRES_DB,
	entities: [User, ParseRequest, Token],
	synchronize: true,
	logging: false,
});

AppDataSource.initialize()
	.then(() => console.log('Successfully connected to database'))
	.catch((error) => console.log(error));

export default AppDataSource;
