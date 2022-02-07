import sendEmail from './sendEmail';

export default async function handler(req, res) {
  switch (req.method) {
    case 'POST':
      sendEmail(req, res);
      break;
    default:
      break;
  }
}
