import { User } from 'src/core/entities';

export const validateUser = ({ email, password }: User): string[] => {
	const errors = [];

	const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
	if (!email.match(emailRegex)) {
		errors.push('Provided email is not valid');
	}

	const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{5,}$/;
	if (!password.match(passwordRegex)) {
		errors.push('Provided password is not valid');
	}

	return errors;
};
