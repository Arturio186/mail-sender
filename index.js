require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const useragent = require('express-useragent');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const knexConfig = require('./knexfile');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(useragent.express());

const db = require('knex')(knexConfig[process.env.NODE_ENV || 'development']);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
  }
});

app.post('/sendEmail', async (req, res) => {
  const formData = req.body;
  const userIP = req.ip;
  const userAgent = req.useragent.source;

  let location = 'Unknown';
  try {
    const response = await fetch(`https://ipapi.co/${userIP}/json/`);
    const data = await response.json();
    location = `${data.city}, ${data.region}, ${data.country_name}`;
  } catch (err) {
    console.error('Error fetching location:', err);
  }

  try {
    await db('formData').insert({
      form_data: JSON.stringify(formData),
      ip: userIP,
      location,
      user_agent: userAgent,
    });
  } catch (err) {
    console.error('Error saving to DB:', err);
  }

  const emailContent = `
    <h2>Новый расчет в форме</h2>
    <p><strong>IP:</strong> ${userIP}</p>
    <p><strong>Location:</strong> ${location}</p>
    <p><strong>User Agent:</strong> ${userAgent}</p>
    <h3>Данные из формы:</h3>
    <ul>
      ${Object.entries(formData).map(([key, value]) => `<li><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${value}</li>`).join('')}
    </ul>
  `;

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: process.env.RECIPIENT_EMAIL,
    subject: 'Новый расчет в форме',
    html: emailContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send('Form submitted successfully');
  } catch (err) {
    console.error('Error sending email:', err);
    res.status(500).send('Email error');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

