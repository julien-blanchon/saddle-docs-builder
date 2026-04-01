export type DocItem = {
	slug: string;
	name: string;
	category?: string;
	items?: DocItem[];
};

export type DemoItem = {
	name: string;
	slug: string;
	description?: string;
};
