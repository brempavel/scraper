export enum LinkType {
	Twitter = 'twitter',
	LinkedIn = 'linkedin',
	PersonalWebsite = 'personal-website',
}

export type ParsedLinks = Record<LinkType, string>;
