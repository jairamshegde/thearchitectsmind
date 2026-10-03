import { SITE } from '../site.config';

export type CmsField = { name: string; label: string; widget: string; required?: boolean; [key: string]: unknown };

const opt = (f: CmsField): CmsField => ({ ...f, required: false });
const str = (name: string, label: string, extra: Partial<CmsField> = {}): CmsField => ({ name, label, widget: 'string', ...extra });
const text = (name: string, label: string, extra: Partial<CmsField> = {}): CmsField => ({ name, label, widget: 'text', ...extra });
const date = (name: string, label: string): CmsField => ({ name, label, widget: 'datetime', format: 'YYYY-MM-DD', time_format: false });
const image = (name: string, label: string): CmsField => opt({ name, label, widget: 'image' });
const list = (name: string, label: string, hint: string): CmsField => ({ name, label, widget: 'list', min: 1, hint });

const title = str('title', 'Title');
const tags = list('tags', 'Tags', 'Comma-separated, e.g. architecture, python');
const featured = opt({ name: 'featured', label: 'Featured on the home page', widget: 'boolean', default: false });
const draft = opt({ name: 'draft', label: 'Draft (untick to publish)', widget: 'boolean', default: true });
const body = (label = 'Body'): CmsField => ({ name: 'body', label, widget: 'markdown' });

/** One folder per entry (<slug>/index.md); uploaded images are stored beside it. */
const folder = (name: string, label: string, label_singular: string, fields: CmsField[]) => ({
  name,
  label,
  label_singular,
  folder: `src/content/${name}`,
  path: '{{slug}}/index',
  extension: 'md',
  format: 'frontmatter',
  create: true,
  slug: '{{slug}}',
  fields,
});

type FolderCollection = ReturnType<typeof folder>;
type FileCollection = { name: string; label: string; files: { name: string; label: string; file: string; fields: CmsField[] }[] };

export const cmsConfig: {
  backend: { name: string; repo: string; branch: string; auth_methods: string[] };
  site_url: string;
  media_folder: string;
  public_folder: string;
  output: { omit_empty_optional_fields: boolean };
  collections: (FolderCollection | FileCollection)[];
} = {
  backend: { name: 'github', repo: `${SITE.owner}/${SITE.repo}`, branch: SITE.branch, auth_methods: ['token'] },
  site_url: `${SITE.url}${SITE.base}/`,
  media_folder: 'public/uploads',
  public_folder: '/uploads',
  output: { omit_empty_optional_fields: true },
  collections: [
    folder('writing', 'Writing', 'Post', [
      title,
      text('description', 'Description', { hint: 'One or two sentences; shown on cards and under the title.' }),
      date('date', 'Date'),
      opt(date('updated', 'Updated')),
      tags,
      image('cover', 'Cover image'),
      featured,
      draft,
      body(),
    ]),
    folder('notes', 'Notes', 'Note', [
      title,
      date('date', 'Date'),
      tags,
      opt(text('description', 'Description')),
      draft,
      body(),
    ]),
    folder('projects', 'Projects', 'Project', [
      title,
      text('summary', 'Summary'),
      list('stack', 'Stack', 'Comma-separated, e.g. Python, FastAPI'),
      date('date', 'Date'),
      opt({ name: 'links', label: 'Links', widget: 'object', fields: [opt(str('repo', 'Repository URL')), opt(str('demo', 'Live demo URL'))] }),
      opt(str('role', 'Role', { hint: 'Case study only' })),
      opt(str('timeline', 'Timeline', { hint: 'Case study only, e.g. Jan – May 2026' })),
      opt(text('problem', 'Problem', { hint: 'Filling Problem or Outcome turns this into a full case study. Markdown allowed.' })),
      opt(text('constraints', 'Constraints')),
      opt(text('outcome', 'Outcome / Impact')),
      opt(text('lessons', 'Lessons')),
      image('cover', 'Cover image (shown in the projects stage)'),
      featured,
      draft,
      body('Approach / Architecture'),
    ]),
    {
      name: 'site',
      label: 'Site',
      files: [
        {
          name: 'about',
          label: 'About',
          file: 'src/content/pages/about.md',
          fields: [
            title,
            text('intro', 'Short intro (home page)'),
            { name: 'now', label: 'Now list (home page)', widget: 'list', required: false, fields: [str('label', 'Label'), str('value', 'Value')] },
            body('Full About page'),
          ],
        },
        {
          name: 'settings',
          label: 'Site settings',
          file: 'src/content/settings/site.json',
          fields: [
            str('heroHeadline', 'Hero headline'),
            opt(str('heroHighlight', 'Highlighted phrase', { hint: 'Must appear exactly in the headline' })),
            text('heroNote', 'Hero handwritten note'),
            str('footerStatement', 'Footer statement'),
            str('footerSub', 'Footer sub line'),
            {
              name: 'socials', label: 'Social links', widget: 'list',
              fields: [str('label', 'Label'), str('url', 'URL'), opt(str('meta', 'Popover meta')), opt(text('note', 'Popover note'))],
            },
          ],
        },
      ],
    },
  ],
};
