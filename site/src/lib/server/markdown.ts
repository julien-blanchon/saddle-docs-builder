import { Marked } from 'marked';
import { createHighlighter, type HighlighterGeneric } from 'shiki';

const THEMES = { light: 'github-light', dark: 'github-dark' } as const;
const LANGS = ['rust', 'toml', 'bash', 'json', 'typescript', 'svelte', 'wgsl', 'glsl'] as const;

let highlighter: HighlighterGeneric<string, string>;

async function getHighlighter() {
	if (!highlighter) {
		highlighter = await createHighlighter({
			themes: Object.values(THEMES),
			langs: [...LANGS]
		});
	}
	return highlighter;
}

function sanitizeLang(lang: string | undefined): string {
	if (!lang) return 'text';
	// Strip Rust doc attributes: "rust,no_run" → "rust"
	const base = lang.split(',')[0].trim();
	return base || 'text';
}

export async function renderMarkdown(source: string): Promise<string> {
	const hl = await getHighlighter();
	const loadedLangs = hl.getLoadedLanguages();

	const marked = new Marked({
		renderer: {
			code({ text, lang }) {
				const safeLang = sanitizeLang(lang);
				const actualLang = loadedLangs.includes(safeLang) ? safeLang : 'text';

				const lightHtml = hl.codeToHtml(text, { lang: actualLang, theme: THEMES.light });
				const darkHtml = hl.codeToHtml(text, { lang: actualLang, theme: THEMES.dark });

				const escaped = text.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

				return `<div class="code-block" data-code="${escaped}" data-language="${safeLang}">
					<div class="shiki-theme-light">${lightHtml}</div>
					<div class="shiki-theme-dark">${darkHtml}</div>
				</div>`;
			},

			table({ header, rows }) {
				// header is an array of cell tokens, rows is an array of row arrays
				const renderCell = (cell: { tokens: unknown[]; header: boolean; align: string | null }) => {
					const tag = cell.header ? 'th' : 'td';
					const align = cell.align ? ` style="text-align:${cell.align}"` : '';
					const content = this.parser.parseInline(cell.tokens);
					return `<${tag}${align}>${content}</${tag}>`;
				};

				const headerHtml = '<tr>' + (header as Array<{ tokens: unknown[]; header: boolean; align: string | null }>).map(renderCell).join('') + '</tr>';
				const bodyHtml = (rows as Array<Array<{ tokens: unknown[]; header: boolean; align: string | null }>>)
					.map(row => '<tr>' + row.map(renderCell).join('') + '</tr>')
					.join('');

				return `<div class="table-wrapper"><table><thead>${headerHtml}</thead><tbody>${bodyHtml}</tbody></table></div>`;
			},

			blockquote({ tokens }) {
				const body = this.parser.parse(tokens);
				return `<div class="blockquote-wrapper"><blockquote>${body}</blockquote></div>`;
			}
		}
	});

	return marked.parse(source);
}
