/* eslint-disable no-console */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');

const {
  PARTNER_CODE,
  ACCESS_KEY,
  SECRET_KEY,
  REDIRECT_URL,
  IPN_URL,
  MOMO_ENDPOINT = 'https://test-payment.momo.vn/v2/gateway/api/create',
  PORT = 3000
} = process.env;

const missingKeys = [];
if (!PARTNER_CODE) missingKeys.push('PARTNER_CODE');
if (!ACCESS_KEY) missingKeys.push('ACCESS_KEY');
if (!SECRET_KEY) missingKeys.push('SECRET_KEY');
if (missingKeys.length) {
  console.warn(
    `Tài nguyên môi trường thiếu: ${missingKeys.join(', ')}. \nHãy kiểm tra .env trước khi gọi API`
  );
}

const app = express();
const defaultOrigins = [
  'http://localhost:19006',
  'http://localhost:19000',
  'https://phe-la-web-delta.vercel.app',
  'https://matte-matcha-teabar.vercel.app'
];
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || defaultOrigins.join(',')
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin không được phép'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const makeRawSignature = ({
  partnerCode,
  accessKey,
  amount,
  extraData,
  ipnUrl,
  orderId,
  orderInfo,
  redirectUrl,
  requestId,
  requestType
}) =>
  `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

const buildPaymentRequest = (input = {}) => {
  if (!PARTNER_CODE || !ACCESS_KEY || !SECRET_KEY) {
    throw new Error('PARTNER_CODE, ACCESS_KEY, SECRET_KEY phai co gia tri trong .env');
  }

  const requestId = input.requestId || `${PARTNER_CODE || 'MOMO'}${Date.now()}`;
  const orderId = input.orderId || requestId;
  const amount = String(input.amount || '10000');
  const requestType = input.requestType || 'captureWallet';
  const extraData = input.extraData || '';
  const redirectUrl = input.redirectUrl || REDIRECT_URL;
  const ipnUrl = input.ipnUrl || IPN_URL;
  const orderInfo = input.orderInfo || 'MoMo frontend test';

  if (!redirectUrl || !ipnUrl) {
    throw new Error('redirectUrl va ipnUrl can phai thiet lap trong .env hoac request body');
  }

  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(
      makeRawSignature({
        partnerCode: PARTNER_CODE,
        accessKey: ACCESS_KEY,
        amount,
        extraData,
        ipnUrl,
        orderId,
        orderInfo,
        redirectUrl,
        requestId,
        requestType
      })
    )
    .digest('hex');

  return {
    partnerCode: PARTNER_CODE,
    accessKey: ACCESS_KEY,
    requestId,
    orderId,
    amount,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData,
    requestType,
    signature,
    lang: 'en'
  };
};

app.get('/', (req, res) => {
  res.json({ name: 'MoMo Express test API', status: 'ready' });
});

app.post('/api/momo/create-payment', async (req, res) => {
  try {
    const body = buildPaymentRequest(req.body);
    const response = await axios.post(MOMO_ENDPOINT, body, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('create-payment response', response.data);
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      console.error(
        'Loi khi tao payment:',
        error.response.status,
        error.response.data
      );
      return res.status(error.response.status).json(error.response.data);
    }

    console.error('Loi khi tao payment:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/momo/ipn', (req, res) => {
  console.log('IPN MoMo payload:', req.body);
  res.json({ received: true });
});

const serverPort = Number(process.env.PORT) || PORT;
app.listen(serverPort, () => {
  console.log(`MoMo test API chay tren port ${serverPort}`);
});
