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

const SCOPES = [
	'https://www.googleapis.com/auth/spreadsheets',
	'https://www.googleapis.com/auth/drive',
];
const CREDENTIALS_PATH = path.join(
	process.cwd(),
	'/src/infrastructure/controllers/ParseController/credentials.json'
);

// @ts-ignore
export const createGoogleSpreadsheet = async (jsonData) => {
	const auth = new google.auth.GoogleAuth({
		keyFile: CREDENTIALS_PATH,
		scopes: SCOPES,
	});

	let client;
	try {
		client = (await auth.getClient()) as OAuth2Client;
	} catch (e) {
		throw ApiError.UnauthorizedError();
	}
	const googleSheets = google.sheets({ version: 'v4', auth: client });

	const createRequestBody = {
		properties: {
			title: 'title',
		},
	};

	let createSheetResponse;
	try {
		createSheetResponse = await googleSheets.spreadsheets.create({
			requestBody: createRequestBody,
			fields: 'spreadsheetId',
		});
	} catch (e) {
		throw ApiError.InternalServerError(e);
	}

	const values = [
		Object.keys(jsonData[0]),
		// @ts-ignore
		...jsonData.map((row) => Object.values(row)),
	];

	const updateRequest = {
		spreadsheetId: createSheetResponse.data.spreadsheetId,
		range: 'A1',
		valueInputOption: 'USER_ENTERED',
		resource: {
			values,
		},
	};

	try {
		await googleSheets.spreadsheets.values.update(updateRequest);
	} catch (e) {
		throw ApiError.InternalServerError(e);
	}

	const drive = google.drive({ version: 'v3', auth: client });
	try {
		await drive.permissions.create({
			fileId: createSheetResponse.data.spreadsheetId,
			requestBody: {
				type: 'anyone',
				role: 'writer',
			},
		});
	} catch (e) {
		throw ApiError.InternalServerError(e);
	}

	return `https://docs.google.com/spreadsheets/d/${createSheetResponse.data.spreadsheetId}`;
};
