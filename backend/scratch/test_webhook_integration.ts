import crypto from 'crypto';
import { MetaCloudApiProvider } from '../src/services/whatsapp/metaCloudApiProvider.js';
import { resolveWhatsAppConfig, maskSecret, maskPhoneNumber } from '../src/config/whatsappConfig.js';
import { memoryStore } from '../src/services/store.js';

const BACKEND_URL = 'http://localhost:5000';
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'whatbot_secure_token';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('\n================================================================');
  console.log('🧪 WhatBot WhatsApp Cloud API Integration & Regression Test Suite');
  console.log('================================================================\n');

  // Ensure bot is enabled at test start
  await fetch(`${BACKEND_URL}/api/bot/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isEnabled: true }),
  });

  // ==========================================================================
  // SUITE 1: Valid Webhook Verification Handshake
  // ==========================================================================
  console.log('--- Suite 1: Valid Webhook Verification Handshake ---');
  const challengeCode = 'challenge_test_' + Math.random().toString(36).substring(2, 8);
  const verifyUrl = `${BACKEND_URL}/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(
    VERIFY_TOKEN
  )}&hub.challenge=${challengeCode}`;

  const verifyRes = await fetch(verifyUrl);
  const verifyBody = await verifyRes.text();

  assert(verifyRes.status === 200, `Expected HTTP 200, received ${verifyRes.status}`);
  assert(verifyBody === challengeCode, `Expected challenge echo "${challengeCode}", received "${verifyBody}"`);

  // Test with whitespace in query param
  const verifyUrlWhitespace = `${BACKEND_URL}/api/webhooks/whatsapp?hub.mode=%20subscribe%20&hub.verify_token=%20${encodeURIComponent(
    VERIFY_TOKEN
  )}%20&hub.challenge=trimmed_challenge_123`;
  const whitespaceRes = await fetch(verifyUrlWhitespace);
  const whitespaceBody = await whitespaceRes.text();
  assert(whitespaceRes.status === 200, 'Handshake trims whitespace in hub parameters successfully');
  assert(whitespaceBody === 'trimmed_challenge_123', 'Whitespace challenge echoed accurately');

  // ==========================================================================
  // SUITE 2: Invalid Webhook Verification Handshake
  // ==========================================================================
  console.log('\n--- Suite 2: Invalid Webhook Verification Handshake ---');
  // 2.1 Invalid token
  const badTokenUrl = `${BACKEND_URL}/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong_token_12345&hub.challenge=test`;
  const badTokenRes = await fetch(badTokenUrl);
  const badTokenBody = await badTokenRes.text();
  assert(badTokenRes.status === 403, `Wrong token expected HTTP 403, received ${badTokenRes.status}`);
  assert(badTokenBody.includes('Verification token mismatch'), 'Response explains token mismatch');

  // 2.2 Invalid hub.mode
  const badModeUrl = `${BACKEND_URL}/api/webhooks/whatsapp?hub.mode=unsubscribe&hub.verify_token=${encodeURIComponent(
    VERIFY_TOKEN
  )}&hub.challenge=test`;
  const badModeRes = await fetch(badModeUrl);
  const badModeBody = await badModeRes.text();
  assert(badModeRes.status === 403, `Invalid hub.mode expected HTTP 403, received ${badModeRes.status}`);
  assert(badModeBody.includes('Invalid hub.mode'), 'Response explains invalid hub.mode');

  // 2.3 Missing verify token
  const missingTokenUrl = `${BACKEND_URL}/api/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=test`;
  const missingTokenRes = await fetch(missingTokenUrl);
  assert(missingTokenRes.status === 403, `Missing token expected HTTP 403, received ${missingTokenRes.status}`);

  // ==========================================================================
  // SUITE 3: Missing Live API Credentials & Precedence Rules
  // ==========================================================================
  console.log('\n--- Suite 3: Missing Live API Credentials & Precedence Rules ---');
  // 3.1 MetaCloudApiProvider instantiated without credentials
  const unconfiguredProvider = new MetaCloudApiProvider({
    phoneNumberId: '',
    accessToken: '',
    webhookVerifyToken: 'test_token',
    metaVersion: 'v20.0',
  });

  const missingCredsResult = await unconfiguredProvider.sendMessage({
    to: '+15551234567',
    type: 'text',
    text: 'Test without credentials',
  });

  assert(missingCredsResult.success === false, 'sendMessage returns success: false when credentials missing');
  assert(
    missingCredsResult.errorCode === 'MISSING_CREDENTIALS',
    `Expected errorCode 'MISSING_CREDENTIALS', received '${missingCredsResult.errorCode}'`
  );
  assert(missingCredsResult.isPermanentError === true, 'Missing credentials marked as permanent error');
  assert(
    Boolean(missingCredsResult.diagnostic?.includes('WHATSAPP_ACCESS_TOKEN')),
    'Diagnostic mentions missing WHATSAPP_ACCESS_TOKEN'
  );

  const missingConnTest = await unconfiguredProvider.testConnection();
  assert(missingConnTest.connected === false, 'testConnection returns connected: false when credentials missing');
  assert(
    missingConnTest.message.includes('missing in configuration'),
    'testConnection returns informative error message'
  );

  // 3.2 Precedence resolution check
  const resolvedPrecedence = resolveWhatsAppConfig({
    mode: 'demo',
    phoneNumberId: 'db_phone_id',
    accessToken: 'db_access_token',
    webhookVerifyToken: 'db_token',
  });
  assert(Boolean(resolvedPrecedence), 'Config resolver produces valid configuration object');
  const expectedMetaVersion = process.env.WHATSAPP_API_VERSION || process.env.META_GRAPH_VERSION || 'v20.0';
  assert(
    resolvedPrecedence.metaVersion === expectedMetaVersion,
    `Graph API version matches configured version (${resolvedPrecedence.metaVersion})`
  );

  // 3.3 Safe Masking Verification
  const maskedSecretResult = maskSecret('EAAB_secret_token_1234567890');
  assert(!maskedSecretResult.includes('secret_token'), 'Secret token is never exposed in plain text');
  assert(maskedSecretResult.includes('••••'), 'Secret token is safely masked');

  const maskedPhoneResult = maskPhoneNumber('+15559876543');
  assert(maskedPhoneResult.includes('****'), 'Phone number is masked in logs');
  assert(maskedPhoneResult.startsWith('+1555'), 'Country code / area prefix preserved for diagnostics');

  // ==========================================================================
  // SUITE 4: Correct Graph API URL, Payload Structure & Headers
  // ==========================================================================
  console.log('\n--- Suite 4: Correct Graph API URL and Payload Format ---');
  const provider = new MetaCloudApiProvider({
    phoneNumberId: '1092837465001',
    accessToken: 'EAAB_test_mock_token_secret_12345',
    webhookVerifyToken: 'test_token',
    metaVersion: 'v20.0',
    appSecret: 'test_app_secret_xyz',
  });

  const originalFetch = global.fetch;
  let capturedFetchUrl = '';
  let capturedFetchHeaders: any = {};
  let capturedFetchBody: any = {};

  (global as any).fetch = async (url: string, opts: any) => {
    capturedFetchUrl = url;
    capturedFetchHeaders = opts.headers;
    capturedFetchBody = JSON.parse(opts.body);
    return {
      ok: true,
      status: 200,
      json: async () => ({
        messaging_product: 'whatsapp',
        contacts: [{ input: '15551234567', wa_id: '15551234567' }],
        messages: [{ id: 'wamid.HBgLMOCKED1234567' }],
      }),
    };
  };

  const sendResult = await provider.sendMessage({
    to: '+1 (555) 123-4567',
    type: 'text',
    text: 'Hello from WhatBot Automated Test!',
  });

  global.fetch = originalFetch;

  assert(sendResult.success === true, 'Mocked sendMessage succeeded');
  assert(sendResult.messageId === 'wamid.HBgLMOCKED1234567', 'Correct messageId returned from Graph API');
  assert(
    capturedFetchUrl === 'https://graph.facebook.com/v20.0/1092837465001/messages',
    `Correct Graph API URL called: ${capturedFetchUrl}`
  );
  assert(
    capturedFetchHeaders['Authorization'] === 'Bearer EAAB_test_mock_token_secret_12345',
    'Bearer token set in header'
  );
  assert(capturedFetchBody.messaging_product === 'whatsapp', 'Payload specifies messaging_product: whatsapp');
  assert(capturedFetchBody.recipient_type === 'individual', 'Payload specifies recipient_type: individual');
  assert(capturedFetchBody.to === '15551234567', 'Recipient phone number normalized to digits only');
  assert(capturedFetchBody.type === 'text', 'Payload type is text');
  assert(capturedFetchBody.text.body === 'Hello from WhatBot Automated Test!', 'Payload text body matches');

  // ==========================================================================
  // SUITE 5: Meta Error 131030 Handling & Diagnostics
  // ==========================================================================
  console.log('\n--- Suite 5: Meta Error 131030 Handling & Diagnostics ---');
  (global as any).fetch = async () => ({
    ok: false,
    status: 400,
    json: async () => ({
      error: {
        message: '(#131030) Recipient phone number not in allowed list',
        type: 'OAuthException',
        code: 131030,
        error_data: {
          messaging_product: 'whatsapp',
          details: 'Recipient phone number not in allowed list: Add recipient phone number to the allowed list and try again.',
        },
        error_subcode: 2494010,
        fbtrace_id: 'test_fbtrace_abc123',
      },
    }),
  });

  const err131030Result = await provider.sendMessage({
    to: '+1 (555) 999-8877',
    type: 'text',
    text: 'Test message to unallowed recipient',
  });

  global.fetch = originalFetch;

  assert(err131030Result.success === false, 'Error 131030 returns success: false');
  assert(err131030Result.errorCode === 131030, `Expected errorCode 131030, received ${err131030Result.errorCode}`);
  assert(err131030Result.traceId === 'test_fbtrace_abc123', 'fbtrace_id captured accurately');
  assert(err131030Result.isPermanentError === true, 'Error 131030 flagged as isPermanentError: true');
  assert(
    Boolean(err131030Result.diagnostic?.includes('allowed list')),
    'Diagnostic explains allowed list requirement'
  );
  assert(
    Boolean(err131030Result.diagnostic?.includes('Test Phone Number (Development Mode)')),
    'Diagnostic clarifies Test Phone Number behavior'
  );
  assert(
    Boolean(err131030Result.diagnostic?.includes('Production Phone Number')),
    'Diagnostic clarifies Production Phone Number behavior'
  );
  assert(
    Boolean(err131030Result.diagnostic?.includes('cannot bypass')),
    'Diagnostic explains code cannot bypass Meta security allowlist'
  );

  // ==========================================================================
  // SUITE 6: Duplicate Webhook Message Deduplication (Idempotency)
  // ==========================================================================
  console.log('\n--- Suite 6: Duplicate Webhook Delivery Protection ---');
  const dupPhone = '155598' + Math.floor(10000 + Math.random() * 90000);
  const dupMessageId = `wamid.DUP_${Date.now()}_TEST`;

  const dupPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '1092837465',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15550001111',
                phone_number_id: 'phone_test_12345',
              },
              contacts: [{ profile: { name: 'Deduplication Tester' }, wa_id: dupPhone }],
              messages: [
                {
                  from: dupPhone,
                  id: dupMessageId,
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  type: 'text',
                  text: { body: 'Hello once' },
                },
              ],
            },
          },
        ],
      },
    ],
  };

  // First delivery
  const firstPost = await fetch(`${BACKEND_URL}/api/webhooks/whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dupPayload),
  });
  assert(firstPost.status === 200, 'Initial delivery returns HTTP 200');

  // Verify conversation created
  const convsRes1 = await fetch(`${BACKEND_URL}/api/conversations`);
  const convsJson1: any = await convsRes1.json();
  const foundConv = convsJson1.data?.find((c: any) =>
    c.contact?.phoneNumber?.replace(/\D/g, '').endsWith(dupPhone.slice(-7))
  );
  assert(Boolean(foundConv), `Conversation found for contact ${dupPhone}`);

  const convDetail1 = await fetch(`${BACKEND_URL}/api/conversations/${foundConv._id}`);
  const convDetail1Json: any = await convDetail1.json();
  const countInitial = convDetail1Json.data?.messages?.length || 0;
  assert(countInitial > 0, 'Initial message and bot reply recorded');

  // Second delivery (Identical wamid)
  const secondPost = await fetch(`${BACKEND_URL}/api/webhooks/whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dupPayload),
  });
  assert(secondPost.status === 200, 'Duplicate delivery acknowledged promptly with HTTP 200');

  const convDetail2 = await fetch(`${BACKEND_URL}/api/conversations/${foundConv._id}`);
  const convDetail2Json: any = await convDetail2.json();
  const countAfterDuplicate = convDetail2Json.data?.messages?.length || 0;

  assert(countAfterDuplicate === countInitial, 'Duplicate wamid was ignored; no duplicate messages recorded');

  // ==========================================================================
  // SUITE 7: Genuine Incoming Text, Interactive Replies & Sample Payload Filter
  // ==========================================================================
  console.log('\n--- Suite 7: Incoming Text, Interactive Replies & Dashboard Sample Filter ---');
  // 7.1 Real customer text message
  const textPhone = '155598' + Math.floor(10000 + Math.random() * 90000);
  const textMsgId = `wamid.TEXT_${Date.now()}`;
  const textPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '1092837465',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15550001111',
                phone_number_id: 'phone_test_12345',
              },
              contacts: [{ profile: { name: 'Text Customer' }, wa_id: textPhone }],
              messages: [
                {
                  from: textPhone,
                  id: textMsgId,
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  type: 'text',
                  text: { body: 'Hi' },
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const textRes = await fetch(`${BACKEND_URL}/api/webhooks/whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(textPayload),
  });
  assert(textRes.status === 200, 'Genuine text message webhook returns HTTP 200');

  // 7.2 Interactive button reply (ID: opt_1, Title: "Our Services")
  const interactivePhone = '1555' + Math.floor(1000000 + Math.random() * 9000000);
  const interactiveMsgId = `wamid.INTERACTIVE_${Date.now()}`;
  const interactivePayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '1092837465',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15550001111',
                phone_number_id: 'phone_test_12345',
              },
              contacts: [{ profile: { name: 'Interactive Customer' }, wa_id: interactivePhone }],
              messages: [
                {
                  from: interactivePhone,
                  id: interactiveMsgId,
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  type: 'interactive',
                  interactive: {
                    type: 'button_reply',
                    button_reply: {
                      id: 'opt_1',
                      title: 'Our Services',
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const interactiveRes = await fetch(`${BACKEND_URL}/api/webhooks/whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(interactivePayload),
  });
  assert(interactiveRes.status === 200, 'Interactive button reply returns HTTP 200');

  // Verify interactive response
  const convsInteractiveRes = await fetch(`${BACKEND_URL}/api/conversations`);
  const convsInteractiveJson: any = await convsInteractiveRes.json();
  const interactiveConv = convsInteractiveJson.data?.find((c: any) =>
    c.contact?.phoneNumber?.replace(/\D/g, '').endsWith(interactivePhone.slice(-7))
  );
  assert(Boolean(interactiveConv), 'Conversation found for interactive reply');

  const interactiveDetailRes = await fetch(`${BACKEND_URL}/api/conversations/${interactiveConv._id}`);
  const interactiveDetailJson: any = await interactiveDetailRes.json();
  const interactiveMsgs: any[] = interactiveDetailJson.data?.messages || [];
  const interactiveBotReply = interactiveMsgs.find((m: any) => m.sender === 'bot');
  assert(Boolean(interactiveBotReply), 'Bot replied to interactive button choice');
  assert(
    interactiveBotReply?.text.includes('Services') || interactiveBotReply?.text.includes('Apex'),
    'Bot reply contains services catalog details'
  );

  // 7.3 Meta App Dashboard Sample Payload Filter
  const samplePayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15550783881',
                phone_number_id: 'WHATSAPP_PHONE_NUMBER_ID',
              },
              contacts: [
                {
                  profile: { name: 'NAME' },
                  wa_id: 'WHATSAPP_USER_ID',
                },
              ],
              messages: [
                {
                  from: 'WHATSAPP_USER_ID',
                  id: 'wamid.HBgLMTQxMjU1NTA4MjkVAgASGBQzQUNCNjk5RDUwNUZGMUZEM0VBRAA=',
                  timestamp: '1650000000',
                  text: { body: 'SUBSCRIBE_TO_UPDATES' },
                  type: 'text',
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const sampleRes = await fetch(`${BACKEND_URL}/api/webhooks/whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(samplePayload),
  });
  const sampleJson: any = await sampleRes.json();
  assert(sampleRes.status === 200, 'Meta Dashboard sample payload acknowledged with HTTP 200');
  assert(sampleJson.success === true, 'Sample payload returns success: true');

  // Verify that dummy user did NOT create a real customer contact
  const convsSampleRes = await fetch(`${BACKEND_URL}/api/conversations`);
  const convsSampleJson: any = await convsSampleRes.json();
  const dummyConv = convsSampleJson.data?.find((c: any) =>
    c.contact?.phoneNumber?.includes('WHATSAPP_USER_ID') || c.contact?.name === 'NAME'
  );
  assert(!dummyConv, 'Meta Dashboard test sample payload did NOT create a dummy customer conversation');

  // ==========================================================================
  // SUITE 8: Status-Only Webhook Notifications
  // ==========================================================================
  console.log('\n--- Suite 8: Status-Only Webhook Notifications ---');
  const statusTestWaMsgId = `wamid.STATUS_TEST_${Date.now()}`;
  const statusPhone = '155598' + Math.floor(10000 + Math.random() * 90000);

  const statusOnlyPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '1092837465',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15550001111',
                phone_number_id: 'phone_test_12345',
              },
              statuses: [
                {
                  id: statusTestWaMsgId,
                  status: 'delivered',
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  recipient_id: statusPhone,
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const statusRes = await fetch(`${BACKEND_URL}/api/webhooks/whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(statusOnlyPayload),
  });
  const statusJson: any = await statusRes.json();

  assert(statusRes.status === 200, 'Status-only webhook returns HTTP 200');
  assert(statusJson.success === true, 'Status notification processed successfully');

  // Verify status update does not create a conversation
  const convsAfterStatusRes = await fetch(`${BACKEND_URL}/api/conversations`);
  const convsAfterStatusJson: any = await convsAfterStatusRes.json();
  const statusOnlyConv = convsAfterStatusJson.data?.find((c: any) =>
    c.contact?.phoneNumber?.replace(/\D/g, '').endsWith(statusPhone.slice(-7))
  );
  assert(!statusOnlyConv, 'Status update notification did NOT create a customer conversation');

  console.log('\n================================================================');
  console.log(`🎉 ALL TESTS PASSED: ${passedTests} / ${totalTests} test cases succeeded!`);
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test execution failed with error:', err);
  process.exit(1);
});
