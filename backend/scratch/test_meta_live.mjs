import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_PHONE_NUMBER_ID;
const version = process.env.WHATSAPP_API_VERSION || 'v20.0';
const targetPhone = process.argv[2];

console.log('=====================================================');
console.log('🧪 WhatBot — Meta WhatsApp Cloud API Connection Diagnostic');
console.log('=====================================================');
console.log(`Phone Number ID : ${phoneId || '❌ MISSING'}`);
console.log(`Graph API Version : ${version}`);
console.log(`Access Token    : ${token ? token.slice(0, 10) + '...' + token.slice(-6) : '❌ MISSING'}`);
console.log('-----------------------------------------------------');

if (!token || !phoneId) {
  console.error('❌ Error: Both WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID must be set in backend/.env');
  process.exit(1);
}

async function runTest() {
  const endpoint = `https://graph.facebook.com/${version}/${phoneId}?fields=verified_name,code_verification_status,quality_rating,display_phone_number`;
  console.log(`\n1️⃣ Testing Meta Handshake: GET ${endpoint}`);

  try {
    const res = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('\n❌ Meta API Connection FAILED (HTTP ' + res.status + '):');
      console.error(JSON.stringify(data, null, 2));

      if (data?.error?.code === 190) {
        console.log('\n💡 Resolution: Your access token is expired or invalid. Please generate a new token from the Meta Developer Dashboard.');
      }
      return;
    }

    console.log('\n✅ Meta API Connection SUCCESSFUL!');
    console.log(`   - Verified Name         : ${data.verified_name || 'N/A'}`);
    console.log(`   - Display Phone Number  : ${data.display_phone_number || 'N/A'}`);
    console.log(`   - Quality Rating        : ${data.quality_rating || 'N/A'}`);
    console.log(`   - Verification Status   : ${data.code_verification_status || 'N/A'}`);

    if (targetPhone) {
      console.log(`\n2️⃣ Sending test message to: ${targetPhone}...`);
      const sendEndpoint = `https://graph.facebook.com/${version}/${phoneId}/messages`;
      const cleanPhone = targetPhone.replace(/\D/g, '');

      const sendRes = await fetch(sendEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: '👋 Hello from WhatBot! Your Meta WhatsApp Cloud API integration is working successfully.'
          }
        })
      });

      const sendData = await sendRes.json();
      if (sendRes.ok) {
        console.log('✅ Test message sent successfully!');
        console.log('   Message ID:', sendData.messages?.[0]?.id);
      } else {
        console.error('❌ Failed to send message (HTTP ' + sendRes.status + '):');
        console.error(JSON.stringify(sendData, null, 2));
      }
    } else {
      console.log('\n💡 Tip: To send a real test message to your phone, pass your number:');
      console.log('   node scratch/test_meta_live.mjs <your-phone-number-with-country-code>');
      console.log('   Example: node scratch/test_meta_live.mjs 919876543210');
    }

  } catch (err) {
    console.error('❌ Network error reaching Meta:', err.message);
  }
}

runTest();
