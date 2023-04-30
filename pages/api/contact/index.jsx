import { Client, LogLevel } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_KEY,
  logLevel: LogLevel.WARN, // Set logLevel to warn or error for better performance
});

// Create a cache of successful CAPTCHA tokens with a TTL of 10 minutes
const captchaCache = new Map();
const captchaTTL = 10 * 60 * 1000; // 10 minutes in milliseconds

const verifyRecaptcha = async (token) => {
  if (captchaCache.has(token)) {
    return true;
  }

  const secretKey = process.env.NEXT_PUBLIC_GOOGLE_CAPATCHA_SECRET_KEY;

  const response = await fetch(
    'https://www.google.com/recaptcha/api/siteverify',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    },
  );

  const result = await response.json();

  if (result.success && result.score >= 0.5) {
    captchaCache.set(token, true);
    setTimeout(() => {
      captchaCache.delete(token);
    }, captchaTTL);
    return true;
  }
  return false;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ message: `${req.method} requests are not allowed` });
  }

  try {
    const {
      token, firstname, lastname, email, message,
    } = JSON.parse(req.body);

    // Verify the Recaptcha token
    const isVerified = await verifyRecaptcha(token);

    if (!isVerified) {
      return res.status(500).json({ msg: 'Recapatcha failed!!!' });
    }

    // Create a new Notion page with the contact form submission
    const entry = {
      parent: {
        database_id: `${process.env.NOTION_CONTACT_FORM_DATABASE_ID}`,
      },
      properties: {
        FirstName: {
          title: [
            {
              text: {
                content: firstname,
              },
            },
          ],
        },
        LastName: {
          rich_text: [
            {
              text: {
                content: lastname,
              },
            },
          ],
        },
        Email: {
          email,
        },
        Message: {
          rich_text: [
            {
              text: {
                content: message,
              },
            },
          ],
        },
        Status: {
          type: 'status',
          status: {
            name: 'New',
          },
        },
      },
    };

    const response = await notion.pages.create(entry);
    return res.status(201).json({ msg: 'Success' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'There was an error' });
  }
}
