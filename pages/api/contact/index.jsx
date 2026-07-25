import { Client, LogLevel } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_KEY,
  logLevel: LogLevel.WARN
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 4000;

let contactDataSourceIdPromise;

const getContactDataSourceId = async () => {
  if (!contactDataSourceIdPromise) {
    contactDataSourceIdPromise = notion.databases
      .retrieve({ database_id: process.env.NOTION_CONTACT_FORM_DATABASE_ID })
      .then((database) => database.data_sources?.[0]?.id)
      .then((dataSourceId) => {
        if (!dataSourceId) throw new Error('The contact database does not contain a data source.');
        return dataSourceId;
      });
  }

  return contactDataSourceIdPromise;
};

const validateSubmission = (body) => {
  const submission = {
    token: typeof body?.token === 'string' ? body.token : '',
    firstname: typeof body?.firstname === 'string' ? body.firstname.trim() : '',
    lastname: typeof body?.lastname === 'string' ? body.lastname.trim() : '',
    email: typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '',
    message: typeof body?.message === 'string' ? body.message.trim() : ''
  };
  const errors = {};

  if (!submission.firstname) errors.firstname = 'Enter your first name.';
  else if (submission.firstname.length > MAX_NAME_LENGTH) errors.firstname = 'First name is too long.';

  if (!submission.lastname) errors.lastname = 'Enter your last name.';
  else if (submission.lastname.length > MAX_NAME_LENGTH) errors.lastname = 'Last name is too long.';

  if (!submission.email) errors.email = 'Enter your email address.';
  else if (!EMAIL_PATTERN.test(submission.email)) errors.email = 'Enter a valid email address.';

  if (!submission.message) errors.message = 'Tell me briefly what you would like to discuss.';
  else if (submission.message.length > MAX_MESSAGE_LENGTH) {
    errors.message = `Keep the message under ${MAX_MESSAGE_LENGTH.toLocaleString()} characters.`;
  }

  if (!submission.token) errors.form = 'Spam protection could not verify this submission.';

  return { submission, errors };
};

const verifyRecaptcha = async (token) => {
  const secretKey = process.env.GOOGLE_RECAPTCHA_SECRET_KEY;
  if (!secretKey) throw new Error('GOOGLE_RECAPTCHA_SECRET_KEY is not configured.');

  const body = new URLSearchParams({
    secret: secretKey,
    response: token
  });
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  if (!response.ok) throw new Error(`reCAPTCHA verification returned ${response.status}.`);

  const result = await response.json();
  return result.success && result.score >= 0.5 && result.action === 'contact_form';
};

export default async function handler(req, res) {
  res.setHeader('Allow', 'POST');
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests are allowed.' });
  }

  if (!process.env.NOTION_KEY || !process.env.NOTION_CONTACT_FORM_DATABASE_ID) {
    return res.status(503).json({ message: 'The contact form is not configured yet.' });
  }

  const { submission, errors } = validateSubmission(req.body);
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Please check the highlighted fields.', errors });
  }

  try {
    const isVerified = await verifyRecaptcha(submission.token);
    if (!isVerified) {
      return res.status(403).json({ message: 'Spam protection rejected this submission. Please try again.' });
    }

    await notion.pages.create({
      parent: {
        data_source_id: await getContactDataSourceId()
      },
      properties: {
        FirstName: {
          title: [{ text: { content: submission.firstname } }]
        },
        LastName: {
          rich_text: [{ text: { content: submission.lastname } }]
        },
        Email: {
          email: submission.email
        },
        Message: {
          rich_text: [{ text: { content: submission.message } }]
        },
        Status: {
          status: { name: 'New' }
        }
      }
    });

    return res.status(201).json({ message: 'Thanks—your message has been sent.' });
  } catch (error) {
    console.error('Contact submission failed:', error.message);
    return res.status(502).json({ message: 'The message could not be sent right now. Please try again later.' });
  }
}
