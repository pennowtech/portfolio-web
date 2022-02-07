// eslint-disable-next-line import/no-unresolved
import sendgrid from '@sendgrid/mail';

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmailSendGrid(req, res) {
  const message = `
  Name: ${req.body.fistname} ${req.body.lastname}\r\n
  Email: ${req.body.email}\r\n
  Message: ${req.body.message}
`;

  const mailData = {
    from: process.env.SENDER_EMAIL,
    to: process.env.RECEIVER_EMAIL,
    replyTo: `${req.body.email}`,
    subject: `New message from ${req.body.firstname}`,
    html: '<div>You\'ve got a mail</div><br />message.replace(/\r\n/g, \'<br />\')',
  };

  try {
    await sendgrid.send(mailData);
  } catch (error) {
    // console.log(error);
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  return res.status(200).json({ status: 'OK', error: '' });
}

export default sendEmailSendGrid;
