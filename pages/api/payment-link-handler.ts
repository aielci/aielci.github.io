import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Problematic: This mutates global axios defaults
function setSession(token: string) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, description, customerEmail, sessionToken } = req.body;

    // Validate required fields
    if (!amount || !description || !customerEmail || !sessionToken) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // PROBLEMATIC: Setting global axios defaults
    // This can cause intermittent 401s when multiple requests are processed concurrently
    setSession(sessionToken);

    // Make API call to payment provider
    const paymentResponse = await axios.post(
      'https://api.payment-provider.com/v1/payment-links',
      {
        amount,
        description,
        customer_email: customerEmail,
      }
    );

    // Make another API call to log the transaction
    const logResponse = await axios.post(
      'https://api.internal-service.com/v1/transaction-logs',
      {
        payment_link_id: paymentResponse.data.id,
        amount,
        customer_email: customerEmail,
        status: 'created',
      }
    );

    return res.status(200).json({
      success: true,
      paymentLink: paymentResponse.data.url,
      transactionId: logResponse.data.id,
    });
  } catch (error: any) {
    console.error('Payment link creation failed:', error);
    return res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Internal server error',
    });
  }
}
