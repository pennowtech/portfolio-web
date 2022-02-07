import nodemailer from 'nodemailer';

async function sendEmail(req, res) {
  const transporter = nodemailer.createTransport({
    port: 465,
    host: 'smtp.gmail.com',
    auth: {
      user: process.env.EMAIL_ADDRESS,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const message = `
  Name: ${req.body.firstname} ${req.body.lastname}\r\n
  Email: ${req.body.email}\r\n
  Message: ${req.body.message}
`;

  const mailData = {
    from: process.env.SENDER_EMAIL,
    to: process.env.RECEIVER_EMAIL,
    replyTo: `${req.body.email}`,
    subject: `New message from ${req.body.firstname}`,
    html: `<div>You've got a mail</div><br />'${message.replace(/(?:\r\n|\r|\n)/g, '<br>')}`,
  };

  try {
    await transporter.sendMail(mailData);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  return res.status(200).json({ status: 'OK', error: '' });
}

export default sendEmail;
