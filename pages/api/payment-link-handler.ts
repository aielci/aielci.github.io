import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

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

    // FIXED: Create request-scoped config with auth headers
    // This prevents concurrent requests from interfering with each other
    const requestConfig = {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    };

    // Make API call to payment provider with per-request auth header
    const paymentResponse = await axios.post(
      'https://api.payment-provider.com/v1/payment-links',
      {
        amount,
        description,
        customer_email: customerEmail,
      },
      requestConfig
    );

    // Make another API call to log the transaction with per-request auth header
    const logResponse = await axios.post(
      'https://api.internal-service.com/v1/transaction-logs',
      {
        payment_link_id: paymentResponse.data.id,
        amount,
        customer_email: customerEmail,
        status: 'created',
      },
      requestConfig
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
