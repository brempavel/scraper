import * as cheerio from 'cheerio';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import process from 'process';
import { ApiError } from '../../errors/ApiError';
import { LinkType, ParsedLinks } from './types';
import { google } from 'googleapis';
import { GoogleAuth, OAuth2Client } from 'google-auth-library';
import { authenticate } from '@google-cloud/local-auth';
import { JSONClient } from 'google-auth-library/build/src/auth/googleauth';

const parseLinks = (links: string[]): ParsedLinks => {
	const allLinks = links.reduce((parsedLinks: ParsedLinks, link) => {
		const { hostname } = new URL(link);
		let name = hostname.replace(/^www\./, '').split('.')[0] as LinkType;
		if (!Object.values(LinkType).includes(name)) {
			name = LinkType.PersonalWebsite;
		}
		parsedLinks[name] = link;
		return parsedLinks;
	}, {} as ParsedLinks);

	const existingLinksNames = Object.keys(allLinks);
	Object.values(LinkType).forEach((type) => {
		if (!existingLinksNames.includes(type)) {
			allLinks[type] = null;
		}
	});

	return allLinks;
};

export const scrapeData = async () => {
	const url = 'https://interaction24.ixda.org';
	let data;
	try {
		const response = await axios.get(url);
		data = response.data;
	} catch (e) {
		const { status } = e;
		if (status >= 400 && status < 500) {
			throw ApiError.BadRequest(e.message);
		}
		if (status >= 500) {
			throw ApiError.InternalServerError(e.message);
		}
	}

	const $ = cheerio.load(data);
	const speakersList = $('.speakers-list_list')
		.children()
		.find('.speakers-list_item-wrapper')
		.map((i, el) => {
			const imgSrc = $(el)
				.find('.speakers-list_item-image-wrapper img')
				.attr('src');
			const name = $(el).find('.speakers-list_item-heading').text().trim();
			const jobTitle = $(el)
				.find('.margin-bottom.margin-small div:last-child')
				.text()
				.trim();
			const links = $(el)
				.find('.speakers-list_social-list a')
				.map((_, el) => $(el).attr('href'))
				.get()
				.filter((link) => !link.includes('index.html'));
			const parsedLinks = parseLinks(links);

			return { img: new URL(imgSrc, url), name, jobTitle, ...parsedLinks };
		})
		.get()
		.filter((speaker) => speaker.name);

	return speakersList;
};

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = path.join(
	process.cwd(),
	'/src/infrastructure/controllers/ParseController/token.json'
);
const CREDENTIALS_PATH = path.join(
	process.cwd(),
	'/src/infrastructure/controllers/ParseController/credentials.json'
);

const loadSavedCredentialsIfExist = async () => {
	try {
		const content = await fs.readFile(TOKEN_PATH);
		const credentials = JSON.parse(content.toString());
		return google.auth.fromJSON(credentials);
	} catch (err) {
		return null;
	}
};

const saveCredentials = async (client: OAuth2Client) => {
	const content = await fs.readFile(CREDENTIALS_PATH);
	const keys = JSON.parse(content.toString());
	const key = keys.installed || keys.web;
	const payload = JSON.stringify({
		type: 'authorized_user',
		client_id: key.client_id,
		client_secret: key.client_secret,
		refresh_token: client.credentials.refresh_token,
	});
	await fs.writeFile(TOKEN_PATH, payload);
};

const authorize = async () => {
	let client = (await loadSavedCredentialsIfExist()) as OAuth2Client;
	console.log(`authorize: ${client}`);
	if (client) {
		return client;
	}
	try {
		client = await authenticate({
			scopes: SCOPES,
			keyfilePath: CREDENTIALS_PATH,
		});
	} catch (e) {
		console.log(e);
	}
	console.log('after authentication');
	if (client.credentials) {
		await saveCredentials(client);
	}
	return client;
};
// @ts-ignore
export const createGoogleSpreadsheet = async (jsonData) => {
	let auth;
	try {
		auth = await authorize();
	} catch (e) {
		console.log(e);
		throw ApiError.UnauthorizedError();
	}

	const service = google.sheets({ version: 'v4', auth });
	const createRequestBody = {
		properties: {
			title: 'title',
		},
	};

	const values = [
		Object.keys(jsonData[0]), // Column headers
		// @ts-ignore
		...jsonData.map((row) => Object.values(row)), // Row values
	];
	try {
		const {
			data: { spreadsheetId },
		} = await service.spreadsheets.create({
			requestBody: createRequestBody,
			fields: 'spreadsheetId',
		});

		const updateRequest = {
			spreadsheetId: spreadsheetId,
			range: 'A1',
			valueInputOption: 'USER_ENTERED',
			resource: {
				values,
			},
		};

		await service.spreadsheets.values.update(updateRequest);

		console.log(`Spreadsheet ID: ${spreadsheetId}`);
		return spreadsheetId;
	} catch (err) {
		// TODO (developer) - Handle exception
		throw err;
	}
};
