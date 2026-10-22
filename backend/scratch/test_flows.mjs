const BASE_URL = 'http://localhost:5000/api';

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return await res.json();
}

async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  return await res.json();
}

async function runTests() {
  console.log('========================================================');
  console.log('🧪 RUNNING COMPREHENSIVE ACCEPTANCE TESTS FOR WHATBOT');
  console.log('========================================================\n');

  // 1. Fetch Conversations to get IDs
  const convRes = await get('/conversations');
  const conversations = convRes.data || [];
  if (conversations.length < 2) {
    console.error('❌ Not enough conversations for multi-session test');
    process.exit(1);
  }

  const conv1 = conversations[0];
  const conv2 = conversations[1];
  console.log(`✅ Using Customer 1 Conv ID: ${conv1._id} (${conv1.contact?.name || 'Customer 1'})`);
  console.log(`✅ Using Customer 2 Conv ID: ${conv2._id} (${conv2.contact?.name || 'Customer 2'})\n`);

  // Reset and Resume Sessions before testing
  await post(`/conversations/${conv1._id}/resume-bot`, {});
  await post(`/conversations/${conv2._id}/resume-bot`, {});
  await post(`/conversations/${conv1._id}/simulate`, { text: 'CANCEL' });
  await post(`/conversations/${conv2._id}/simulate`, { text: 'CANCEL' });

  // ----------------------------------------------------
  // TEST SUITE 1: Welcome Menu & Services Booking Flow
  // ----------------------------------------------------
  console.log('--- TEST 1: Service Booking Conversation Flow ---');
  
  // Step 1: Send Hi
  let r1 = await post(`/conversations/${conv1._id}/simulate`, { text: 'Hi' });
  console.log('[User 1]: Hi');
  console.log('[Bot 1]:', r1.data?.botReply?.text?.split('\n')[0]);
  if (!r1.data?.botReply?.text?.includes('Welcome')) {
    throw new Error('Test 1 Step 1 Failed: Welcome greeting missing');
  }

  // Step 2: Select "Our Services"
  let r2 = await post(`/conversations/${conv1._id}/simulate`, { text: 'Our Services' });
  console.log('\n[User 1]: Our Services');
  console.log('[Bot 1]:', r2.data?.botReply?.text?.split('\n')[0]);
  if (!r2.data?.botReply?.text?.includes('Website Development')) {
    throw new Error('Test 1 Step 2 Failed: Services list not returned');
  }

  // Step 3: Select "Website Development"
  let r3 = await post(`/conversations/${conv1._id}/simulate`, { text: 'Website Development' });
  console.log('\n[User 1]: Website Development');
  console.log('[Bot 1]:', r3.data?.botReply?.text);
  if (!r3.data?.botReply?.text?.includes('What type of website do you need?')) {
    throw new Error('Test 1 Step 3 Failed: First follow-up question not asked');
  }

  // Step 4: Answer Question 1: "Business website"
  let r4 = await post(`/conversations/${conv1._id}/simulate`, { text: 'Business website' });
  console.log('\n[User 1]: Business website');
  console.log('[Bot 1]:', r4.data?.botReply?.text);
  if (!r4.data?.botReply?.text?.includes('budget')) {
    throw new Error('Test 1 Step 4 Failed: Second follow-up question (budget) not asked');
  }

  // Step 5: Answer Question 2: "₹20,000"
  let r5 = await post(`/conversations/${conv1._id}/simulate`, { text: '₹20,000' });
  console.log('\n[User 1]: ₹20,000');
  console.log('[Bot 1]:', r5.data?.botReply?.text);
  if (!r5.data?.botReply?.text?.includes('start')) {
    throw new Error('Test 1 Step 5 Failed: Third follow-up question (start timeline) not asked');
  }

  // Step 6: Answer Question 3: "Next week" -> Booking Summary
  let r6 = await post(`/conversations/${conv1._id}/simulate`, { text: 'Next week' });
  console.log('\n[User 1]: Next week');
  console.log('[Bot 1]:', r6.data?.botReply?.text);
  if (!r6.data?.botReply?.text?.toLowerCase().includes('booking request summary')) {
    throw new Error('Test 1 Step 6 Failed: Booking summary not shown');
  }

  // Step 7: Confirm with "YES"
  let r7 = await post(`/conversations/${conv1._id}/simulate`, { text: 'YES' });
  console.log('\n[User 1]: YES');
  console.log('[Bot 1]:', r7.data?.botReply?.text);
  const bkRefMatch = r7.data?.botReply?.text?.match(/BK-\d+/);
  if (!bkRefMatch) {
    throw new Error('Test 1 Step 7 Failed: Booking reference not generated');
  }
  const generatedBookingRef = bkRefMatch[0];
  console.log(`\n🎉 Generated Booking Reference: ${generatedBookingRef}`);

  // Step 8: Verify Booking in database
  const trackBk = await get(`/bookings/track/${generatedBookingRef}`);
  if (!trackBk.data || trackBk.data.bookingReference !== generatedBookingRef) {
    throw new Error(`Test 1 Step 8 Failed: Booking ${generatedBookingRef} not found in database`);
  }
  console.log(`✅ Verified in DB: Booking ${generatedBookingRef} for "${trackBk.data.itemName || trackBk.data.serviceName}" by "${trackBk.data.customerName}" with requirements:`, trackBk.data.requirements || trackBk.data.customerRequirements);

  // ----------------------------------------------------
  // TEST SUITE 2: Catalog Conversation & Product Order
  // ----------------------------------------------------
  console.log('\n\n--- TEST 2: Product Catalog & Order Flow ---');

  // Send "MENU" to return to menu
  let c1 = await post(`/conversations/${conv1._id}/simulate`, { text: 'MENU' });
  console.log('[User 1]: MENU');
  console.log('[Bot 1]:', c1.data?.botReply?.text?.split('\n')[0]);

  // Select "View Catalog"
  let c2 = await post(`/conversations/${conv1._id}/simulate`, { text: 'View Catalog' });
  console.log('\n[User 1]: View Catalog');
  console.log('[Bot 1]:', c2.data?.botReply?.text?.split('\n')[0]);
  if (!c2.data?.botReply?.text?.includes('Enterprise WhatsApp Automation Appliance Mini')) {
    throw new Error('Test 2 Step 2 Failed: Catalog items not listed');
  }

  // Select Product: "Enterprise WhatsApp Automation Appliance Mini"
  let c3 = await post(`/conversations/${conv1._id}/simulate`, { text: 'Enterprise WhatsApp Automation Appliance Mini' });
  console.log('\n[User 1]: Enterprise WhatsApp Automation Appliance Mini');
  console.log('[Bot 1]:', c3.data?.botReply?.text);
  if (!c3.data?.botReply?.text?.includes('quantity') && !c3.data?.botReply?.text?.includes('How many units')) {
    throw new Error('Test 2 Step 3 Failed: Product quantity not requested');
  }

  // Quantity: "2"
  let c4 = await post(`/conversations/${conv1._id}/simulate`, { text: '2' });
  console.log('\n[User 1]: 2');
  console.log('[Bot 1]:', c4.data?.botReply?.text);

  let c5;
  // If product requires delivery address:
  if (c4.data?.botReply?.text?.includes('ship') || c4.data?.botReply?.text?.includes('address')) {
    let cAddress = await post(`/conversations/${conv1._id}/simulate`, { text: '100 Innovation Park, Tech Corridor, Bangalore 560001' });
    console.log('\n[User 1]: 100 Innovation Park, Tech Corridor, Bangalore 560001');
    console.log('[Bot 1]:', cAddress.data?.botReply?.text);
    c5 = await post(`/conversations/${conv1._id}/simulate`, { text: 'YES' });
  } else {
    c5 = await post(`/conversations/${conv1._id}/simulate`, { text: 'YES' });
  }

  // Order Confirmed
  console.log('\n[User 1]: YES');
  console.log('[Bot 1]:', c5.data?.botReply?.text);
  const ordRefMatch = c5.data?.botReply?.text?.match(/ORD-\d+/);
  if (!ordRefMatch) {
    throw new Error('Test 2 Step 5 Failed: Order reference not generated');
  }
  const generatedOrderRef = ordRefMatch[0];
  console.log(`\n🎉 Generated Order Reference: ${generatedOrderRef}`);

  // Verify Order in database
  const trackOrd = await get(`/orders/track/${generatedOrderRef}`);
  if (!trackOrd.data || trackOrd.data.orderReference !== generatedOrderRef) {
    throw new Error(`Test 2 Step 6 Failed: Order ${generatedOrderRef} not found in database`);
  }
  console.log(`✅ Verified in DB: Order ${generatedOrderRef} for "${trackOrd.data.itemName || trackOrd.data.productName}" (Qty: ${trackOrd.data.quantity}, Total: ₹${trackOrd.data.totalPrice})`);

  // ----------------------------------------------------
  // TEST SUITE 3: Navigation Commands (BACK, CANCEL, HELP)
  // ----------------------------------------------------
  console.log('\n\n--- TEST 3: Navigation Commands (BACK, CANCEL, HELP) ---');

  // Start a flow
  await post(`/conversations/${conv1._id}/simulate`, { text: 'Our Services' });
  await post(`/conversations/${conv1._id}/simulate`, { text: 'Website Development' });
  console.log('[User 1]: In Website Development flow...');

  // BACK
  let b1 = await post(`/conversations/${conv1._id}/simulate`, { text: 'BACK' });
  console.log('[User 1]: BACK');
  console.log('[Bot 1]:', b1.data?.botReply?.text?.split('\n')[0]);

  // CANCEL
  let can1 = await post(`/conversations/${conv1._id}/simulate`, { text: 'CANCEL' });
  console.log('\n[User 1]: CANCEL');
  console.log('[Bot 1]:', can1.data?.botReply?.text?.split('\n')[0]);
  if (!can1.data?.botReply?.text?.toLowerCase().includes('cancelled')) {
    throw new Error('Test 3 Failed: CANCEL did not reset draft');
  }

  // HELP
  let h1 = await post(`/conversations/${conv1._id}/simulate`, { text: 'HELP' });
  console.log('\n[User 1]: HELP');
  console.log('[Bot 1]:', h1.data?.botReply?.text?.split('\n')[0]);
  if (!h1.data?.botReply?.text?.toLowerCase().includes('help')) {
    throw new Error('Test 3 Failed: HELP did not show command instructions');
  }

  // ----------------------------------------------------
  // TEST SUITE 4: Human Handoff & Pausing Automation
  // ----------------------------------------------------
  console.log('\n\n--- TEST 4: Human Handoff & Pausing Automated Replies ---');
  let handoffRes = await post(`/conversations/${conv1._id}/simulate`, { text: 'Talk to an Agent' });
  console.log('[User 1]: Talk to an Agent');
  console.log('[Bot 1]:', handoffRes.data?.botReply?.text);
  if (!handoffRes.data?.botReply?.text?.toLowerCase().includes('human')) {
    throw new Error('Test 4 Failed: Human handoff message not sent');
  }

  // Verify conversation status is pending
  const convAfterHandoff = await get(`/conversations/${conv1._id}`);
  console.log(`✅ Conversation Status: ${convAfterHandoff.data.conversation.status} (Expected: pending)`);
  if (convAfterHandoff.data.conversation.status !== 'pending') {
    throw new Error('Test 4 Failed: Conversation status was not set to pending');
  }

  // Customer sends another normal message - Bot should NOT auto reply!
  let silentMsg = await post(`/conversations/${conv1._id}/simulate`, { text: 'Are you still there?' });
  console.log('\n[User 1]: Are you still there?');
  console.log('[Bot reply should be null]:', silentMsg.data?.botReply);
  if (silentMsg.data?.botReply) {
    throw new Error('Test 4 Failed: Bot replied while human handoff was active');
  }
  console.log('✅ Automated replies paused while handoff active!');

  // Agent resumes bot
  let resumeRes = await post(`/conversations/${conv1._id}/resume-bot`, {});
  console.log('\n[Agent]: Resumed Bot ->', resumeRes.message);

  // Now customer sends Hi again -> Bot replies
  let resumeHi = await post(`/conversations/${conv1._id}/simulate`, { text: 'Hi' });
  console.log('[User 1]: Hi');
  console.log('[Bot 1]:', resumeHi.data?.botReply?.text?.split('\n')[0]);
  if (!resumeHi.data?.botReply) {
    throw new Error('Test 4 Failed: Bot did not reply after resuming');
  }
  console.log('✅ Bot automation successfully restored!');

  // ----------------------------------------------------
  // TEST SUITE 5: Simultaneous Isolated Customer Sessions
  // ----------------------------------------------------
  console.log('\n\n--- TEST 5: Simultaneous Isolated Customer Sessions ---');
  // Customer 1 in Services flow
  await post(`/conversations/${conv1._id}/simulate`, { text: 'CANCEL' });
  await post(`/conversations/${conv1._id}/simulate`, { text: 'Our Services' });
  await post(`/conversations/${conv1._id}/simulate`, { text: 'Website Development' });

  // Customer 2 in Catalog flow
  await post(`/conversations/${conv2._id}/simulate`, { text: 'CANCEL' });
  await post(`/conversations/${conv2._id}/simulate`, { text: 'View Catalog' });
  await post(`/conversations/${conv2._id}/simulate`, { text: 'Enterprise WhatsApp Automation Appliance Mini' });

  // Check Session 1
  const session1 = await get(`/conversations/${conv1._id}/session`);
  // Check Session 2
  const session2 = await get(`/conversations/${conv2._id}/session`);

  console.log(`Customer 1 State: ${session1.data.state}, Item: ${session1.data.selectedItemName}, Draft: ${session1.data.draftType}`);
  console.log(`Customer 2 State: ${session2.data.state}, Item: ${session2.data.selectedItemName}, Draft: ${session2.data.draftType}`);

  if (session1.data.draftType !== 'booking' || session2.data.draftType !== 'order') {
    throw new Error('Test 5 Failed: Customer sessions are not isolated!');
  }
  if (session1.data.selectedItemName !== 'Website Development' || session2.data.selectedItemName !== 'Enterprise WhatsApp Automation Appliance Mini') {
    throw new Error('Test 5 Failed: Customer session items mixed up!');
  }
  console.log('✅ Customer 1 and Customer 2 sessions are completely isolated!');

  console.log('\n========================================================');
  console.log('🏆 ALL ACCEPTANCE TESTS PASSED SUCCESSFULLY! 100% VERIFIED');
  console.log('========================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ ACCEPTANCE TEST FAILED:', err.message);
  process.exit(1);
});
