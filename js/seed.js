/* ============================================================
   AI for Seva — Seed mock data (deterministic)
   Builds one interconnected dataset so shared IDs flow across
   WF-006 / WF-002 / WF-003 and the leadership command center.
   ============================================================ */
window.App = window.App || {};

App.seed = (function () {
  var U = App.util;

  /* ---- deterministic PRNG (mulberry32) ---- */
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var R = rng(20260623);
  function pick(arr) { return arr[Math.floor(R() * arr.length)]; }
  function pickW(pairs) { // [[val,weight],...]
    var tot = pairs.reduce(function (a, p) { return a + p[1]; }, 0), r = R() * tot;
    for (var i = 0; i < pairs.length; i++) { r -= pairs[i][1]; if (r <= 0) return pairs[i][0]; }
    return pairs[0][0];
  }
  function ri(a, b) { return a + Math.floor(R() * (b - a + 1)); }
  function chance(p) { return R() < p; }
  function daysAgo(d) { return U.daysAgo(d).toISOString(); }
  function hoursAgo(h) { var x = U.now(); x.setHours(x.getHours() - h); return x.toISOString(); }
  function hoursFromNow(h) { return U.hoursFromNow(h).toISOString(); }

  /* ---------------- reference data ---------------- */
  var CENTERS = [
    { id: 'HYD', name: 'HKM Hyderabad', short: 'Hyderabad', city: 'Hyderabad', primary: true },
    { id: 'SEC', name: 'HKM Secunderabad', short: 'Secunderabad', city: 'Secunderabad' },
    { id: 'GCB', name: 'HKM Gachibowli', short: 'Gachibowli', city: 'Gachibowli' }
  ];
  var DEPTS = [
    { id: 'DON', name: 'Donor Relations', icon: '🪔' },
    { id: 'YAT', name: 'Yatra & Pilgrimage', icon: '🛕' },
    { id: 'MKT', name: 'Digital Marketing', icon: '📣' },
    { id: 'VOX', name: 'Voice / Telecalling Ops', icon: '📞' },
    { id: 'CRM', name: 'CRM & Data Governance', icon: '🗂️' },
    { id: 'FIN', name: 'Finance / DCC', icon: '🧾' }
  ];
  var ROLES = {
    leadership:       { label: 'Leadership', scope: 'all', icon: '👑' },
    workflow_manager: { label: 'Workflow Manager', scope: 'manage', icon: '🧭' },
    data_custodian:   { label: 'Data Custodian', scope: 'wf006', icon: '🗂️' },
    consent_custodian:{ label: 'Consent / Privacy Custodian', scope: 'wf006', icon: '🛡️' },
    voice_ops:        { label: 'AI Voice Ops Admin', scope: 'wf002', icon: '🎙️' },
    supervisor:       { label: 'Calling Supervisor', scope: 'wf002', icon: '📋' },
    telecaller:       { label: 'Telecaller / Closer', scope: 'wf002', icon: '🎧' },
    marketer:         { label: 'Digital Marketer', scope: 'wf003', icon: '📣' },
    content_reviewer: { label: 'Content / Creative Reviewer', scope: 'wf003', icon: '✍️' },
    donor_approver:   { label: 'Donor Relations Approver', scope: 'approve', icon: '🤝' },
    finance_reviewer: { label: 'Finance / DCC Reviewer', scope: 'wf003', icon: '🧾' }
  };

  var USERS = [
    { id: 'U-MUKUND', name: 'Mukund Prabhu', role: 'leadership', dept: 'DON', center: 'HYD', email: 'mukund@hkmhyderabad.org' },
    { id: 'U-HEM',    name: 'Hemchand Das', role: 'workflow_manager', dept: 'MKT', center: 'HYD', email: 'hemchand@hkmhyderabad.org' },
    { id: 'U-SACHI',  name: 'Sachi Prabhu', role: 'data_custodian', dept: 'CRM', center: 'HYD', email: 'sachi@hkmhyderabad.org' },
    { id: 'U-VENKAT', name: 'Venkat Rao', role: 'consent_custodian', dept: 'CRM', center: 'HYD', email: 'venkat@hkmhyderabad.org' },
    { id: 'U-DEEPAK', name: 'Deepak Sharma', role: 'voice_ops', dept: 'VOX', center: 'HYD', email: 'deepak@hkmhyderabad.org' },
    { id: 'U-LAKSHMI',name: 'Lakshmi Iyer', role: 'supervisor', dept: 'VOX', center: 'HYD', email: 'lakshmi@hkmhyderabad.org' },
    { id: 'U-ANAND',  name: 'Anand Krishna', role: 'telecaller', dept: 'VOX', center: 'HYD', email: 'anand@hkmhyderabad.org' },
    { id: 'U-PRIYA',  name: 'Priya Nair', role: 'telecaller', dept: 'VOX', center: 'SEC', email: 'priya@hkmhyderabad.org' },
    { id: 'U-ROHIT',  name: 'Rohit Verma', role: 'marketer', dept: 'MKT', center: 'HYD', email: 'rohit@hkmhyderabad.org' },
    { id: 'U-MEERA',  name: 'Meera Desai', role: 'content_reviewer', dept: 'MKT', center: 'HYD', email: 'meera@hkmhyderabad.org' },
    { id: 'U-GOPAL',  name: 'Gopal Das', role: 'donor_approver', dept: 'DON', center: 'HYD', email: 'gopal@hkmhyderabad.org' },
    { id: 'U-NANDA',  name: 'Nanda Kishore', role: 'finance_reviewer', dept: 'FIN', center: 'HYD', email: 'nanda@hkmhyderabad.org' }
  ];
  var TELECALLERS = ['U-ANAND', 'U-PRIYA', 'U-LAKSHMI'];

  var SOURCES = [
    { id: 'google_ads', label: 'Google Ads', cat: 'paid', icon: '🔍' },
    { id: 'meta_ads', label: 'Meta Ads', cat: 'paid', icon: '📘' },
    { id: 'youtube', label: 'YouTube', cat: 'paid', icon: '▶️' },
    { id: 'whatsapp', label: 'WhatsApp Broadcast', cat: 'owned', icon: '💬' },
    { id: 'website', label: 'Website Form', cat: 'owned', icon: '🌐' },
    { id: 'event', label: 'Festival / Event', cat: 'offline', icon: '🎪' },
    { id: 'referral', label: 'Devotee Referral', cat: 'organic', icon: '🤝' },
    { id: 'walkin', label: 'Temple Walk-in', cat: 'offline', icon: '🚶' },
    { id: 'helloleads', label: 'Hello Leads Import', cat: 'import', icon: '📥' }
  ];
  var LANGS = ['Telugu', 'Hindi', 'English', 'Tamil', 'Kannada'];
  var CITIES = ['Hyderabad', 'Secunderabad', 'Gachibowli', 'Kukatpally', 'Madhapur', 'Banjara Hills', 'Kondapur', 'Miyapur', 'LB Nagar', 'Begumpet'];
  var SEGMENTS = ['Yatra Prospect', 'Active Donor', 'HNI Donor', 'CSR / Corporate', 'Festival Attendee', 'Lapsed Donor', 'New Lead', 'Life Patron'];

  var FIRST = ['Ravi', 'Sita', 'Krishna', 'Lakshmi', 'Venkat', 'Padma', 'Suresh', 'Anitha', 'Mahesh', 'Geetha', 'Ramesh', 'Divya', 'Srinivas', 'Kavya', 'Naresh', 'Swathi', 'Praveen', 'Deepthi', 'Kiran', 'Sravani', 'Arun', 'Bhavana', 'Vijay', 'Sneha', 'Harish', 'Pooja', 'Sandeep', 'Madhuri', 'Rajesh', 'Anjali', 'Teja', 'Keerthi', 'Murali', 'Shilpa', 'Naveen', 'Vandana'];
  var LAST = ['Teja', 'Reddy', 'Kumar', 'Rao', 'Sharma', 'Iyer', 'Naidu', 'Gupta', 'Varma', 'Prasad', 'Murthy', 'Chowdary', 'Nair', 'Goud', 'Shetty', 'Bhat', 'Agarwal', 'Menon', 'Pillai', 'Das'];

  function name() { return pick(FIRST) + ' ' + pick(LAST); }
  function mobile() { return '+91 ' + pickW([['98', 3], ['99', 3], ['70', 2], ['81', 2], ['63', 1]]) + ri(10000, 99999) + '' + ri(100, 999); }
  function email(n) { return n.toLowerCase().replace(/\s+/g, '.') + ri(1, 99) + '@' + pick(['gmail.com', 'gmail.com', 'yahoo.in', 'outlook.com', 'rediffmail.com']); }

  /* ---------------- campaigns (WF-003) ---------------- */
  var CAMPAIGN_DEFS = [
    { id: 'CMP-J26', name: 'Janmashtami Maha Abhishekam 2026', type: 'Festival', obj: 'Donations + Festival registrations for Sri Krishna Janmashtami', channels: ['google_ads', 'meta_ads', 'whatsapp'], budget: 850000, spend: 612400, status: 'active', appr: 'approved', start: 28, owner: 'U-ROHIT', dept: 'MKT', center: 'HYD', hero: true },
    { id: 'CMP-VRJ', name: 'Vrindavan Kartik Yatra — Early Bird', type: 'Yatra', obj: 'Fill 3 Vrindavan Yatra batches (Nov 2026)', channels: ['meta_ads', 'youtube', 'website'], budget: 600000, spend: 318900, status: 'active', appr: 'approved', start: 21, owner: 'U-ROHIT', dept: 'YAT', center: 'HYD' },
    { id: 'CMP-ANN', name: 'Annadaan Seva — Monthly Giving', type: 'Donation', obj: 'Recurring meal-seva donor acquisition', channels: ['google_ads', 'meta_ads'], budget: 420000, spend: 405100, status: 'active', appr: 'approved', start: 45, owner: 'U-ROHIT', dept: 'DON', center: 'HYD' },
    { id: 'CMP-GAU', name: 'Gau Seva Go-shala Appeal', type: 'Donation', obj: 'Cow protection seva fund', channels: ['meta_ads', 'whatsapp'], budget: 250000, spend: 0, status: 'pending_approval', appr: 'pending', start: 2, owner: 'U-ROHIT', dept: 'DON', center: 'GCB' },
    { id: 'CMP-CSR', name: 'CSR Partnership Outreach Q3', type: 'Donation', obj: 'Corporate CSR for food-relief programmes', channels: ['website', 'referral'], budget: 180000, spend: 96200, status: 'active', appr: 'approved', start: 30, owner: 'U-HEM', dept: 'DON', center: 'HYD' },
    { id: 'CMP-GIT', name: 'Bhagavad Gita Daan — Always On', type: 'Donation', obj: 'Sponsor Gita distribution', channels: ['google_ads', 'youtube'], budget: 300000, spend: 142800, status: 'active', appr: 'approved', start: 60, owner: 'U-ROHIT', dept: 'MKT', center: 'SEC' },
    { id: 'CMP-DRAFT', name: 'Govardhan Puja Festival 2026', type: 'Festival', obj: 'Festival footfall + anna-koota donations', channels: ['meta_ads', 'whatsapp', 'youtube'], budget: 400000, spend: 0, status: 'draft', appr: 'draft', start: -1, owner: 'U-ROHIT', dept: 'MKT', center: 'HYD' }
  ];

  function buildCampaigns() {
    return CAMPAIGN_DEFS.map(function (c) {
      var leads = c.spend > 0 ? Math.round(c.spend / ri(180, 520)) : 0;
      var calls = Math.round(leads * (0.55 + R() * 0.3));
      var conversions = Math.round(leads * (0.06 + R() * 0.09));
      var avgGift = c.type === 'Yatra' ? ri(18000, 32000) : c.type === 'Festival' ? ri(2100, 9000) : ri(1100, 6500);
      var revenue = c.spend > 0 ? Math.round(conversions * avgGift) : 0;
      // 14-day daily series
      var daily = [];
      for (var d = 13; d >= 0; d--) {
        var f = 0.6 + R() * 0.8;
        daily.push({
          date: daysAgo(d),
          spend: Math.round((c.spend / 18) * f),
          leads: Math.round((leads / 18) * f),
          conversions: Math.max(0, Math.round((conversions / 16) * f)),
          revenue: Math.round((revenue / 16) * f)
        });
      }
      return {
        id: c.id, name: c.name, type: c.type, objective: c.obj, channels: c.channels,
        budget: c.budget, spend: c.spend, status: c.status, approvalStatus: c.appr,
        ownerId: c.owner, approverId: 'U-MUKUND', deptId: c.dept, centerId: c.center,
        startDate: c.start >= 0 ? daysAgo(c.start) : null,
        leads: leads, calls: calls, conversions: conversions, revenue: revenue,
        cpl: leads ? Math.round(c.spend / leads) : 0,
        cpa: conversions ? Math.round(c.spend / conversions) : 0,
        roas: c.spend ? +(revenue / c.spend).toFixed(2) : 0,
        utm: c.id.toLowerCase().replace('cmp-', 'hkht_'),
        landingPageId: 'LP-' + c.id.slice(4),
        daily: daily, hero: !!c.hero,
        risk: c.appr === 'approved' ? 'green' : c.appr === 'pending' ? 'amber' : 'amber'
      };
    });
  }

  /* ---------------- contacts + profiles (WF-006) ---------------- */
  function buildContacts() {
    var contacts = [], donors = [], yatris = [], leads = [], suppression = [];
    var N = 64;
    // hero contact for golden journey
    var hero = makeContact(0, { id: 'CON-100245', name: 'Ravi Teja Gupta', mobile: '+91 98480 21455', city: 'Gachibowli', lang: 'Telugu', source: 'meta_ads', campaign: 'CMP-J26', segment: 'HNI Donor', owner: 'U-GOPAL', dq: 96, consent: { dnd: false, optOut: false, channels: { call: true, whatsapp: true, sms: true, email: true } }, donor: true, hero: true });
    contacts.push(hero.contact); if (hero.donor) donors.push(hero.donor); if (hero.lead) leads.push(hero.lead);

    for (var i = 1; i < N; i++) {
      var made = makeContact(i, {});
      contacts.push(made.contact);
      if (made.donor) donors.push(made.donor);
      if (made.yatri) yatris.push(made.yatri);
      if (made.lead) leads.push(made.lead);
      if (made.suppress) suppression.push(made.suppress);
    }
    return { contacts: contacts, donors: donors, yatris: yatris, leads: leads, suppression: suppression };
  }

  function makeContact(i, override) {
    var nm = override.name || name();
    var src = override.source || pickW([['google_ads', 3], ['meta_ads', 4], ['youtube', 2], ['website', 3], ['event', 3], ['referral', 2], ['walkin', 2], ['whatsapp', 2], ['helloleads', 3]]);
    var cid = override.id || ('CON-' + (100300 + i));
    var dnd = override.consent ? override.consent.dnd : chance(0.12);
    var optOut = override.consent ? override.consent.optOut : chance(0.07);
    var segment = override.segment || pick(SEGMENTS);
    var isDonor = override.donor != null ? override.donor : /Donor|Patron|CSR/.test(segment) || chance(0.35);
    var isYatri = override.yatri != null ? override.yatri : /Yatra/.test(segment) || chance(0.25);
    var dq = override.dq != null ? override.dq : pickW([[ri(88, 99), 5], [ri(70, 87), 3], [ri(45, 69), 2]]);
    var createdD = override.created != null ? override.created : ri(1, 120);
    var campaign = override.campaign || (src.indexOf('ads') > -1 || src === 'youtube' || src === 'website' ? pick(['CMP-J26', 'CMP-VRJ', 'CMP-ANN', 'CMP-GIT', 'CMP-CSR']) : null);

    var consent = override.consent || {
      dnd: dnd, optOut: optOut,
      channels: { call: !dnd, whatsapp: !optOut, sms: !dnd && chance(0.8), email: chance(0.85) }
    };
    var missingSource = chance(0.06) && !override.hero;
    var contact = {
      type: 'contact', id: cid, name: nm,
      mobile: override.mobile || mobile(),
      email: chance(0.85) ? email(nm) : '',
      city: override.city || pick(CITIES),
      language: override.lang || pickW([['Telugu', 5], ['Hindi', 3], ['English', 2], ['Tamil', 1], ['Kannada', 1]]),
      source: missingSource ? null : src,
      lastSource: campaign ? src : src,
      campaignId: campaign,
      segment: segment,
      ownerId: override.owner || pick(['U-GOPAL', 'U-ANAND', 'U-PRIYA', 'U-SACHI', 'U-HEM']),
      centerId: override.center || pickW([['HYD', 6], ['SEC', 2], ['GCB', 2]]),
      consent: consent,
      createdDate: daysAgo(createdD),
      lastTouch: daysAgo(ri(0, Math.min(createdD, 40))),
      dqScore: missingSource ? Math.min(dq, 64) : dq,
      tags: [], hero: !!override.hero,
      dupRisk: chance(0.1) ? ri(60, 92) : ri(2, 30)
    };
    contact.donorId = null; contact.yatriId = null;

    var donor = null, yatri = null, lead = null, suppress = null;
    if (isDonor) {
      var tier = override.donor && override.tier ? override.tier : (/HNI/.test(segment) ? 'HNI' : /CSR/.test(segment) ? 'CSR' : pickW([['Regular', 5], ['HNI', 1], ['New', 3], ['Life Patron', 1]]));
      var nGifts = tier === 'HNI' || tier === 'Life Patron' ? ri(4, 14) : ri(1, 6);
      var gifts = [];
      for (var g = 0; g < nGifts; g++) {
        gifts.push({ id: 'DON-' + cid.slice(4) + '-' + g, amount: tier === 'HNI' ? ri(25000, 200000) : tier === 'CSR' ? ri(100000, 500000) : ri(501, 11000), date: daysAgo(ri(5, 400)), seva: pick(['Annadaan', 'Gau Seva', 'Gita Daan', 'Deity Seva', 'Yatra Sponsorship', 'Festival Seva']), campaignId: campaign, status: chance(0.92) ? 'Receipted' : 'Pending receipt' });
      }
      var totalGiven = U.sum(gifts, function (x) { return x.amount; });
      contact.donorId = 'DNR-' + cid.slice(4);
      donor = { type: 'donor', id: contact.donorId, contactId: cid, name: nm, tier: tier, totalGiven: totalGiven, gifts: gifts, relationshipOwner: contact.ownerId, sevaInterests: [pick(['Annadaan', 'Gau Seva', 'Gita Daan', 'Temple Construction', 'Festival']), pick(['Yatra', 'Deity Seva', 'Education'])], lastGift: gifts[0] ? gifts[0].date : null };
    }
    if (isYatri) {
      contact.yatriId = 'YAT-' + cid.slice(4);
      yatri = { type: 'yatri', id: contact.yatriId, contactId: cid, name: nm, yatra: pick(['Vrindavan Kartik', 'Jagannath Puri', 'Mayapur Gaura Purnima', 'Tirupati Special']), registration: pickW([['Interested', 4], ['Registered', 2], ['Paid', 2], ['Waitlist', 1]]), paymentStatus: pickW([['Not started', 4], ['Partial', 2], ['Paid', 2]]), referrals: ri(0, 3) };
    }
    if (campaign) {
      lead = { type: 'lead', id: 'LEAD-' + cid.slice(4), contactId: cid, campaignId: campaign, source: src, status: pickW([['New', 3], ['Contacted', 4], ['Qualified', 2], ['Converted', 1], ['Lost', 1]]), createdDate: contact.createdDate, ownerId: contact.ownerId };
    }
    if (dnd || optOut || chance(0.05)) {
      suppress = { contactId: cid, name: nm, mobile: contact.mobile, type: dnd ? 'DND' : optOut ? 'Opt-out' : pick(['Not interested', 'Unsubscribed']), channel: dnd ? 'Voice' : 'WhatsApp', reason: pick(['Registered on national DND', 'Replied STOP', 'Requested no contact', 'Complaint logged']), date: daysAgo(ri(2, 90)), addedBy: 'U-VENKAT' };
    }
    return { contact: contact, donor: donor, yatri: yatri, lead: lead, suppress: suppress };
  }

  /* ---------------- scripts (WF-002) ---------------- */
  function buildScripts() {
    return [
      { id: 'SCR-J26-TE', name: 'Janmashtami Donation — Telugu', category: 'Donation / donor-sensitive', version: 'v3.1', status: 'production', campaignId: 'CMP-J26', approverId: 'U-GOPAL', approvalDate: daysAgo(12), language: 'Telugu', outcomeCodes: ['Interested', 'Donated', 'Callback', 'Not interested', 'Wrong number', 'Escalate'], qa: 94, opening: 'Hare Krishna! I am calling from Hare Krishna Movement Hyderabad regarding the upcoming Sri Krishna Janmashtami Maha Abhishekam seva...' },
      { id: 'SCR-VRJ-HI', name: 'Vrindavan Yatra Enquiry — Hindi', category: 'Standard info', version: 'v2.0', status: 'production', campaignId: 'CMP-VRJ', approverId: 'U-HEM', approvalDate: daysAgo(18), language: 'Hindi', outcomeCodes: ['Interested', 'Registered', 'Callback', 'Price concern', 'Not interested', 'Escalate'], qa: 91, opening: 'Hare Krishna! Vrindavan Kartik Yatra ke baare mein aapki ruchi ke liye dhanyavaad...' },
      { id: 'SCR-ANN-TE', name: 'Annadaan Monthly Giving — Telugu', category: 'Donation / donor-sensitive', version: 'v1.4', status: 'production', campaignId: 'CMP-ANN', approverId: 'U-GOPAL', approvalDate: daysAgo(22), language: 'Telugu', outcomeCodes: ['Interested', 'Donated', 'Callback', 'Not interested', 'Escalate'], qa: 88, opening: 'Hare Krishna! Prasadam distribution seva ke liye...' },
      { id: 'SCR-GAU-TE', name: 'Gau Seva Appeal — Telugu', category: 'Donation / donor-sensitive', version: 'v0.9', status: 'review', campaignId: 'CMP-GAU', approverId: 'U-GOPAL', approvalDate: null, language: 'Telugu', outcomeCodes: ['Interested', 'Donated', 'Callback', 'Not interested', 'Escalate'], qa: null, opening: 'Hare Krishna! Go-shala gau-mata seva...' },
      { id: 'SCR-CSR-EN', name: 'CSR Corporate Outreach — English', category: 'Financial / commitment', version: 'v1.0', status: 'draft', campaignId: 'CMP-CSR', approverId: 'U-NANDA', approvalDate: null, language: 'English', outcomeCodes: ['Interested', 'Meeting set', 'Callback', 'Not interested', 'Escalate'], qa: null, opening: 'Good morning, I am reaching out from HKM Hyderabad regarding our CSR food-relief partnership...' }
    ];
  }

  /* ---------------- calls + transcripts (WF-002) ---------------- */
  var TRANSCRIPTS = {
    donated: [
      ['agent', 'Hare Krishna! I am calling from Hare Krishna Movement Hyderabad about the Janmashtami Maha Abhishekam seva. Is this a good time to talk?'],
      ['contact', 'Hare Krishna. Yes, please tell me.'],
      ['agent', 'This Janmashtami we are offering Abhishekam seva sponsorship. Many devotees are participating. Would you like to offer seva this year?'],
      ['contact', 'Last year I gave for Annadaan. What is the amount for Abhishekam?'],
      ['agent', 'Seva starts from ₹2,100 and there is a special Abhishekam sponsorship at ₹11,000 with prasadam and a certificate.'],
      ['contact', 'Okay, I would like to do the ₹11,000 Abhishekam seva. Please send me the payment link on WhatsApp.'],
      ['agent', 'Wonderful! Hare Krishna. I will send the secure link right away and our team will share your receipt.']
    ],
    callback: [
      ['agent', 'Hare Krishna! Calling from HKM Hyderabad regarding Vrindavan Kartik Yatra. Is this a good time?'],
      ['contact', 'I am in a meeting right now, can you call me in the evening?'],
      ['agent', 'Of course. What time works best?'],
      ['contact', 'After 7 PM please.'],
      ['agent', 'Noted, I will arrange a callback after 7 PM. Hare Krishna!']
    ],
    escalate: [
      ['agent', 'Hare Krishna! Calling from HKM Hyderabad regarding your recent donation enquiry.'],
      ['contact', 'Yes — actually I made a payment of ₹50,000 last week but I have not received my 80G receipt yet. This is the second time I am following up.'],
      ['agent', 'I am very sorry for the delay. This is important — let me escalate this to our donor relations team immediately so they can resolve your receipt today.'],
      ['contact', 'Please do. I am a regular donor and this is disappointing.'],
      ['agent', 'I completely understand. Our senior team will call you back within the hour with a resolution. Hare Krishna.']
    ],
    notinterested: [
      ['agent', 'Hare Krishna! Calling from HKM Hyderabad about the Janmashtami seva.'],
      ['contact', 'Not interested, please remove my number.'],
      ['agent', 'I understand. I will update our records and you will not be contacted again. Hare Krishna.']
    ],
    noanswer: []
  };

  function buildCalls(contacts, scripts) {
    var calls = [];
    var callable = contacts.filter(function (c) { return c.consent.channels.call && c.campaignId; });
    // hero call
    var hero = contacts.find(function (c) { return c.hero; });
    calls.push(makeCall('CALL-50231', hero, 'CMP-J26', 'SCR-J26-TE', 'U-ANAND', 'donated', hoursAgo(26), true));

    var outcomes = [['donated', 2], ['callback', 4], ['notinterested', 2], ['escalate', 1], ['noanswer', 4], ['interested', 3]];
    for (var i = 0; i < 46; i++) {
      var c = pick(callable);
      var oc = pickW(outcomes);
      var scr = scripts.find(function (s) { return s.campaignId === c.campaignId; }) || scripts[0];
      calls.push(makeCall('CALL-' + (50300 + i), c, c.campaignId, scr ? scr.id : 'SCR-J26-TE', pick(TELECALLERS), oc, hoursAgo(ri(1, 240)), false));
    }
    return calls;
  }

  function makeCall(id, contact, campaignId, scriptId, agentId, outcomeKind, when, hero) {
    var connected = outcomeKind !== 'noanswer';
    var transcript = (TRANSCRIPTS[outcomeKind] || []).map(function (t) { return { who: t[0], text: t[1] }; });
    var intentMap = {
      donated: { intent: 'Donation intent', outcome: 'Donated', objection: null, score: 92, conf: 0.96 },
      interested: { intent: 'Positive interest', outcome: 'Interested', objection: 'Will decide later', score: 74, conf: 0.88 },
      callback: { intent: 'Callback requested', outcome: 'Callback', objection: 'Busy now', score: 61, conf: 0.93 },
      escalate: { intent: 'Service issue (receipt)', outcome: 'Escalate', objection: 'Receipt not received', score: 80, conf: 0.71 },
      notinterested: { intent: 'Not interested', outcome: 'Not interested', objection: 'No interest', score: 8, conf: 0.9 },
      noanswer: { intent: null, outcome: 'No answer', objection: null, score: null, conf: null }
    };
    var m = intentMap[outcomeKind];
    var lowConf = m.conf != null && m.conf < 0.78;
    return {
      type: 'call', id: id, contactId: contact.id, contactName: contact.name,
      campaignId: campaignId, scriptId: scriptId, ownerId: agentId,
      attempt: connected ? ri(1, 3) : ri(1, 4),
      status: connected ? 'Connected' : pick(['No answer', 'Busy', 'Switched off']),
      duration: connected ? ri(45, 320) : 0,
      language: contact.language,
      recordingRef: connected ? 'rec_' + id.toLowerCase() + '.mp3' : null,
      transcript: transcript,
      intent: m.intent, outcome: m.outcome, objection: m.objection,
      leadScore: m.score, confidence: m.conf,
      lowConfidence: lowConf,
      escalated: outcomeKind === 'escalate',
      approvalNeeded: outcomeKind === 'escalate' || (outcomeKind === 'donated' && (contact.donorId && contact.segment && /HNI|CSR/.test(contact.segment))),
      reviewed: !lowConf && chance(0.6),
      createdAt: when, hero: !!hero, outcomeKind: outcomeKind
    };
  }

  /* ---------------- tasks (WF-002) ---------------- */
  function buildTasks(calls, contacts) {
    var tasks = [];
    calls.filter(function (c) { return c.outcome === 'Callback'; }).forEach(function (c, i) {
      var overdue = chance(0.35);
      tasks.push({
        type: 'task', id: 'TASK-' + (7100 + i), kind: 'Callback', contactId: c.contactId, contactName: c.contactName,
        callId: c.id, campaignId: c.campaignId, ownerId: c.ownerId,
        priority: c.leadScore > 70 ? 'High' : 'Medium',
        dueDate: overdue ? hoursAgo(ri(2, 40)) : hoursFromNow(ri(1, 48)),
        status: overdue ? 'Overdue' : 'Open',
        slaStatus: overdue ? 'Breached' : 'On track',
        createdAt: c.createdAt, note: 'Callback requested during call ' + c.id
      });
    });
    // hero callback completed -> shows in journey
    // a few proactive follow-ups
    contacts.filter(function (c) { return c.donorId; }).slice(0, 6).forEach(function (c, i) {
      tasks.push({ type: 'task', id: 'TASK-' + (7200 + i), kind: 'Follow-up', contactId: c.id, contactName: c.name, callId: null, campaignId: c.campaignId, ownerId: c.ownerId, priority: pick(['Medium', 'Low']), dueDate: hoursFromNow(ri(12, 96)), status: 'Open', slaStatus: 'On track', createdAt: daysAgo(ri(1, 8)), note: 'Cultivation follow-up — ' + c.segment });
    });
    return tasks;
  }

  /* ---------------- whatsapp (WF-002) ---------------- */
  var WA_TEMPLATES = [
    { id: 'WA-PAYLINK', name: 'Donation payment link', category: 'Transactional', status: 'approved', body: 'Hare Krishna {{name}} 🙏 Thank you for your Janmashtami seva. Complete your ₹{{amount}} offering securely here: {{link}}' },
    { id: 'WA-YATRA-BR', name: 'Yatra brochure', category: 'Service', status: 'approved', body: 'Hare Krishna {{name}} 🙏 Here is the Vrindavan Kartik Yatra brochure & itinerary: {{link}}. Reply YES to register.' },
    { id: 'WA-RECEIPT', name: '80G receipt', category: 'Transactional', status: 'approved', body: 'Hare Krishna {{name}} 🙏 Your 80G donation receipt is ready: {{link}}' },
    { id: 'WA-FEST-INV', name: 'Festival invitation', category: 'Service', status: 'approved', body: 'Hare Krishna {{name}} 🙏 You are invited to Sri Krishna Janmashtami at HKM Hyderabad. Details: {{link}}' },
    { id: 'WA-CSR-CUST', name: 'CSR custom proposal', category: 'Nurture', status: 'pending', body: 'Custom donor-sensitive message — pending approval' }
  ];
  function buildWhatsApp(calls, contacts) {
    var msgs = [];
    calls.filter(function (c) { return c.outcome === 'Donated' || c.outcome === 'Interested' || c.outcome === 'Callback'; }).forEach(function (c, i) {
      var tmpl = c.campaignId === 'CMP-VRJ' ? 'WA-YATRA-BR' : 'WA-PAYLINK';
      var st = pickW([['delivered', 4], ['read', 4], ['replied', 2], ['sent', 1], ['failed', 1]]);
      msgs.push({
        type: 'wa', id: 'MSG-' + (9100 + i), templateId: tmpl, contactId: c.contactId, contactName: c.contactName,
        campaignId: c.campaignId, status: st, reply: st === 'replied' ? pick(['YES', 'Done, paid 🙏', 'Will do tomorrow', 'Please call me']) : null,
        linkClick: ['read', 'replied'].indexOf(st) > -1 && chance(0.6), approvalStatus: 'approved',
        ownerId: c.ownerId, createdAt: c.createdAt, optOut: st === 'failed' && chance(0.3)
      });
    });
    return msgs;
  }

  /* ---------------- escalations (WF-002) ---------------- */
  function buildEscalations(calls) {
    return calls.filter(function (c) { return c.escalated; }).map(function (c, i) {
      return {
        type: 'esc', id: 'ESC-' + (3100 + i), contactId: c.contactId, contactName: c.contactName, callId: c.id,
        reason: 'Donor receipt delay — sensitive', priority: 'High', assigneeId: 'U-GOPAL',
        status: i === 0 ? 'Open' : pick(['Open', 'In progress', 'Resolved']),
        slaDue: hoursFromNow(1), createdAt: c.createdAt,
        context: 'Regular donor reports ₹50,000 payment last week with no 80G receipt; second follow-up. Frustrated tone.',
        talkingPoints: ['Acknowledge delay & thank for past giving', 'Confirm payment in DCC', 'Issue receipt today', 'Offer prasadam as goodwill']
      };
    });
  }

  /* ---------------- dedupe candidates (WF-006) ---------------- */
  function buildMergeCandidates(contacts) {
    var out = [];
    for (var i = 0; i < 7; i++) {
      var a = contacts[ri(1, contacts.length - 1)];
      var conf = ri(72, 98);
      var hv = !!a.donorId && /HNI|CSR/.test(a.segment || '');
      out.push({
        id: 'MRG-' + (4100 + i), confidence: conf,
        records: [
          { contactId: a.id, name: a.name, mobile: a.mobile, source: a.source, created: a.createdDate, dq: a.dqScore },
          { contactId: 'CON-DUP' + i, name: a.name + (chance(0.5) ? '' : ' '), mobile: a.mobile.replace(/\d$/, String(ri(0, 9))), source: pick(['helloleads', 'event', 'website']), created: daysAgo(ri(60, 200)), dq: ri(50, 80) }
        ],
        signals: ['Phone exact', conf > 85 ? 'Name exact' : 'Name fuzzy (0.8)', chance(0.5) ? 'Email match' : 'City match'],
        highValue: hv, status: 'pending', reviewerId: 'U-SACHI',
        note: hv ? 'High-value donor — manual review mandatory; do not auto-merge.' : null
      });
    }
    return out;
  }

  /* ---------------- import batches (WF-006) ---------------- */
  function buildImports() {
    return [
      { id: 'IMP-2206', fileName: 'janmashtami_meta_leads_jun.csv', source: 'meta_ads', total: 412, valid: 388, rejected: 9, duplicates: 15, dqScore: 91, status: 'needs_approval', uploadedBy: 'U-ROHIT', createdAt: hoursAgo(3), errors: [{ row: 14, field: 'mobile', issue: 'Invalid format' }, { row: 88, field: 'source', issue: 'Missing source tag' }, { row: 203, field: 'consent', issue: 'No consent basis' }] },
      { id: 'IMP-2205', fileName: 'helloleads_export_week24.csv', source: 'helloleads', total: 1240, valid: 1118, rejected: 47, duplicates: 75, dqScore: 84, status: 'imported', uploadedBy: 'U-SACHI', createdAt: daysAgo(2), errors: [] },
      { id: 'IMP-2204', fileName: 'gau_seva_walkin_cards.csv', source: 'walkin', total: 96, valid: 71, rejected: 18, duplicates: 7, dqScore: 67, status: 'needs_approval', uploadedBy: 'U-VENKAT', createdAt: hoursAgo(20), errors: [{ row: 5, field: 'mobile', issue: 'Missing' }, { row: 31, field: 'name', issue: 'Incomplete' }] },
      { id: 'IMP-2203', fileName: 'csr_corporate_list.csv', source: 'referral', total: 38, valid: 38, rejected: 0, duplicates: 2, dqScore: 95, status: 'imported', uploadedBy: 'U-HEM', createdAt: daysAgo(5), errors: [] }
    ];
  }

  /* ---------------- API registry (WF-006) ---------------- */
  function buildApiRegistry() {
    return [
      { id: 'API-CRM', name: 'CRM / DBMS (Hello Leads)', provider: 'Hello Leads', status: 'fallback', workflows: ['WF-006', 'WF-002', 'WF-003'], access: 'REST API (pending key)', owner: 'U-SACHI', blocker: 'Final API key & rate limits pending vendor', cost: 'Included', priority: 'P0', uptime: 99.1, fallbackMode: 'CSV import + manual review' },
      { id: 'API-TWILIO', name: 'Twilio Voice', provider: 'Twilio', status: 'pending', workflows: ['WF-002'], access: 'Programmable Voice', owner: 'U-DEEPAK', blocker: 'Number provisioning + DLT registration', cost: '₹0.45 / min', priority: 'P0', uptime: null, fallbackMode: 'Manual priority call sheet' },
      { id: 'API-WA', name: 'WhatsApp BSP (Interakt)', provider: 'Interakt', status: 'confirmed', workflows: ['WF-002', 'WF-003'], access: 'Cloud API', owner: 'U-DEEPAK', blocker: null, cost: '₹0.88 / conv', priority: 'P0', uptime: 99.7, fallbackMode: 'Manual messaging queue' },
      { id: 'API-GADS', name: 'Google Ads', provider: 'Google', status: 'confirmed', workflows: ['WF-003'], access: 'Google Ads API', owner: 'U-ROHIT', blocker: null, cost: 'Spend-based', priority: 'P0', uptime: 99.9, fallbackMode: 'Manual report export' },
      { id: 'API-META', name: 'Meta Ads', provider: 'Meta', status: 'confirmed', workflows: ['WF-003'], access: 'Marketing API', owner: 'U-ROHIT', blocker: null, cost: 'Spend-based', priority: 'P0', uptime: 99.8, fallbackMode: 'Manual report export' },
      { id: 'API-GA4', name: 'Google Analytics 4', provider: 'Google', status: 'confirmed', workflows: ['WF-003'], access: 'Data API', owner: 'U-ROHIT', blocker: null, cost: 'Free tier', priority: 'P1', uptime: 99.9, fallbackMode: 'Manual report export' },
      { id: 'API-PAY', name: 'Payment Gateway (Razorpay) / DCC', provider: 'Razorpay', status: 'pending', workflows: ['WF-003', 'WF-002'], access: 'Payments + Webhooks', owner: 'U-NANDA', blocker: 'DCC reconciliation field mapping', cost: '2% + GST', priority: 'P0', uptime: 99.6, fallbackMode: 'Manual status upload' },
      { id: 'API-VERTEX', name: 'Gemini / Vertex AI', provider: 'Google Cloud', status: 'confirmed', workflows: ['WF-006', 'WF-002', 'WF-003'], access: 'Vertex AI / Agent Builder', owner: 'U-HEM', blocker: null, cost: 'Token-based (central)', priority: 'P1', uptime: 99.9, fallbackMode: 'Human draft-only' },
      { id: 'API-BQ', name: 'BigQuery / Looker Studio', provider: 'Google Cloud', status: 'confirmed', workflows: ['WF-006', 'WF-002', 'WF-003'], access: 'BQ + Looker', owner: 'U-SACHI', blocker: null, cost: 'Query-based', priority: 'P1', uptime: 99.9, fallbackMode: 'Sheets dashboard' },
      { id: 'API-DND', name: 'DND / Suppression Service', provider: 'TRAI DLT', status: 'pending', workflows: ['WF-006', 'WF-002'], access: 'DLT scrubbing', owner: 'U-VENKAT', blocker: 'DLT entity registration in progress', cost: 'Subscription', priority: 'P0', uptime: null, fallbackMode: 'Manual suppression list' },
      { id: 'API-CLOUDRUN', name: 'Cloud Run / Workflows', provider: 'Google Cloud', status: 'confirmed', workflows: ['WF-006', 'WF-002'], access: 'Sync jobs / webhooks', owner: 'U-SACHI', blocker: null, cost: 'Usage-based', priority: 'P1', uptime: 99.95, fallbackMode: 'Manual batch sync' },
      { id: 'API-CLICKUP', name: 'ClickUp (task layer)', provider: 'ClickUp', status: 'blocked', workflows: ['WF-002'], access: 'API', owner: 'U-LAKSHMI', blocker: 'Workspace access not granted', cost: 'Per seat', priority: 'P1', uptime: null, fallbackMode: 'CRM tasks / manual sheet' }
    ];
  }

  /* ---------------- approvals queue (platform-wide HITL) ---------------- */
  function buildApprovals() {
    return [
      { id: 'APR-001', type: 'Campaign budget', title: 'Gau Seva Go-shala Appeal — launch & ₹2.5L budget', entity: 'campaign', entityId: 'CMP-GAU', requestedBy: 'U-ROHIT', approverRole: 'leadership', status: 'pending', priority: 'High', createdAt: hoursAgo(5), slaDue: hoursFromNow(19), context: 'New donation campaign, budget ceiling ₹2,50,000, Meta + WhatsApp. Landing page QA 88/100. Script in review.' },
      { id: 'APR-002', type: 'Voice script', title: 'Gau Seva Appeal script v0.9 — Telugu', entity: 'script', entityId: 'SCR-GAU-TE', requestedBy: 'U-DEEPAK', approverRole: 'donor_approver', status: 'pending', priority: 'Medium', createdAt: hoursAgo(8), slaDue: hoursFromNow(16), context: 'Donor-sensitive donation script. Needs donor approver sign-off on tone, sensitivity and outcome-code mapping before production.' },
      { id: 'APR-003', type: 'Contact merge', title: 'High-value donor merge — possible HNI duplicate', entity: 'merge', entityId: 'MRG-4100', requestedBy: 'U-SACHI', approverRole: 'data_custodian', status: 'pending', priority: 'High', createdAt: hoursAgo(2), slaDue: hoursFromNow(22), context: 'Two records, 94% match, conflicting donation history. Platform rule: HNI records never auto-merged.' },
      { id: 'APR-004', type: 'Bulk import', title: 'Janmashtami Meta leads — 388 records to production', entity: 'import', entityId: 'IMP-2206', requestedBy: 'U-ROHIT', approverRole: 'data_custodian', status: 'pending', priority: 'Medium', createdAt: hoursAgo(3), slaDue: hoursFromNow(21), context: '412 raw → 388 valid, 15 duplicates, 9 rejected. 3 records missing consent basis flagged.' },
      { id: 'APR-005', type: 'Content / creative', title: 'Janmashtami ad copy variant set (5)', entity: 'content', entityId: 'CNT-J26-1', requestedBy: 'U-ROHIT', approverRole: 'content_reviewer', status: 'pending', priority: 'Medium', createdAt: hoursAgo(11), slaDue: hoursFromNow(13), context: 'AI-drafted ad copy + WhatsApp variants. Devotional claims need content reviewer approval before publish.' },
      { id: 'APR-006', type: 'WhatsApp template', title: 'CSR custom proposal template', entity: 'wa_template', entityId: 'WA-CSR-CUST', requestedBy: 'U-HEM', approverRole: 'donor_approver', status: 'pending', priority: 'Low', createdAt: hoursAgo(28), slaDue: hoursFromNow(-4), context: 'Donor-sensitive custom message outside standard template inventory.' },
      { id: 'APR-DONE-1', type: 'Voice script', title: 'Janmashtami Donation script v3.1 — Telugu', entity: 'script', entityId: 'SCR-J26-TE', requestedBy: 'U-DEEPAK', approverRole: 'donor_approver', status: 'approved', priority: 'High', createdAt: daysAgo(13), slaDue: daysAgo(12), decisionBy: 'U-GOPAL', decisionAt: daysAgo(12), context: 'Approved for production after QA test call.', note: 'Tone and outcome codes approved. Good for production.' },
      { id: 'APR-DONE-2', type: 'Campaign budget', title: 'Janmashtami Maha Abhishekam — ₹8.5L', entity: 'campaign', entityId: 'CMP-J26', requestedBy: 'U-ROHIT', approverRole: 'leadership', status: 'approved', priority: 'High', createdAt: daysAgo(29), slaDue: daysAgo(28), decisionBy: 'U-MUKUND', decisionAt: daysAgo(28), context: 'Flagship festival campaign.', note: 'Approved. Monitor ROAS weekly.' }
    ];
  }

  /* ---------------- audit log (WF-006) ---------------- */
  function buildAudit() {
    var acts = [
      ['U-SACHI', 'Merged contacts', 'merge', 'MRG-4099', 'Approved low-risk merge (96% match)'],
      ['U-VENKAT', 'Added DND suppression', 'consent', 'CON-100312', 'National DND registration'],
      ['U-ROHIT', 'Exported leads CSV', 'export', 'CMP-J26', '388 records — flagged for audit'],
      ['U-GOPAL', 'Approved script', 'approval', 'SCR-J26-TE', 'v3.1 to production'],
      ['U-MUKUND', 'Approved campaign budget', 'approval', 'CMP-J26', '₹8,50,000'],
      ['U-ANAND', 'Logged call outcome', 'data', 'CALL-50231', 'Donation intent captured'],
      ['U-SACHI', 'Bulk import', 'import', 'IMP-2205', '1,118 records imported'],
      ['U-DEEPAK', 'Updated script', 'data', 'SCR-VRJ-HI', 'v2.0 localization'],
      ['U-VENKAT', 'Viewed donor PII', 'access', 'DNR-00245', 'HNI donor profile'],
      ['U-HEM', 'Changed role access', 'access', 'U-PRIYA', 'Granted SEC center access']
    ];
    return acts.map(function (a, i) {
      return { id: 'AUD-' + (8100 + i), actorId: a[0], action: a[1], type: a[2], entityId: a[3], detail: a[4], timestamp: hoursAgo(ri(1, 72) + i) };
    });
  }

  /* ---------------- usage & cost (central billing) ---------------- */
  function buildUsage() {
    // per service monthly, split by center + dept
    var services = [
      { id: 'voice', name: 'Twilio Voice', unit: 'min', rate: 0.45, icon: '📞', wf: 'WF-002' },
      { id: 'whatsapp', name: 'WhatsApp BSP', unit: 'conv', rate: 0.88, icon: '💬', wf: 'WF-002/003' },
      { id: 'ai', name: 'Gemini / Vertex AI', unit: 'gen', rate: 1.20, icon: '✨', wf: 'all' },
      { id: 'ads', name: 'Ad Spend (Google+Meta)', unit: '₹', rate: 1, icon: '📣', wf: 'WF-003' },
      { id: 'sms', name: 'SMS / RCS', unit: 'msg', rate: 0.18, icon: '📩', wf: 'WF-002/003' },
      { id: 'cloud', name: 'Cloud Run / BigQuery', unit: 'unit', rate: 0.02, icon: '☁️', wf: 'all' }
    ];
    var rows = [];
    services.forEach(function (s) {
      CENTERS.forEach(function (ctr) {
        DEPTS.forEach(function (dp) {
          if (R() < 0.45) return; // sparse
          var qty = s.id === 'ads' ? ri(20000, 280000) : s.id === 'voice' ? ri(400, 9000) : s.id === 'whatsapp' ? ri(200, 6000) : s.id === 'ai' ? ri(100, 3000) : ri(50, 2000);
          rows.push({ service: s.id, serviceName: s.name, unit: s.unit, icon: s.icon, wf: s.wf, centerId: ctr.id, deptId: dp.id, qty: qty, cost: Math.round(qty * s.rate), budget: 0 });
        });
      });
    });
    // monthly trend 6 months
    var trend = [];
    var base = 1850000;
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].forEach(function (mo, i) {
      trend.push({ month: mo, cost: Math.round(base * (0.7 + i * 0.08 + R() * 0.1)) });
    });
    return { services: services, rows: rows, trend: trend, budgetMonthly: 2400000 };
  }

  /* ---------------- landing pages + content (WF-003) ---------------- */
  function buildLandingPages() {
    return [
      { id: 'LP-J26', campaignId: 'CMP-J26', url: 'hkmhyderabad.org/janmashtami-seva', qaScore: 96, status: 'live', issues: [] },
      { id: 'LP-VRJ', campaignId: 'CMP-VRJ', url: 'hkmhyderabad.org/vrindavan-yatra', qaScore: 92, status: 'live', issues: [{ sev: 'low', text: 'Hero image > 400KB — compress for mobile' }] },
      { id: 'LP-ANN', campaignId: 'CMP-ANN', url: 'hkmhyderabad.org/annadaan', qaScore: 89, status: 'live', issues: [{ sev: 'med', text: 'Payment gateway test mode still enabled on one path' }] },
      { id: 'LP-GAU', campaignId: 'CMP-GAU', url: 'hkmhyderabad.org/gau-seva', qaScore: 88, status: 'qa', issues: [{ sev: 'med', text: 'UTM parameters not firing on form submit' }, { sev: 'low', text: 'Missing 80G tax-benefit copy' }, { sev: 'high', text: 'CRM lead webhook not connected — leads would not sync' }] }
    ];
  }
  function buildContent() {
    return [
      { id: 'CNT-J26-1', campaignId: 'CMP-J26', channel: 'Meta Ad', status: 'pending_approval', reviewerId: 'U-MEERA', variants: [
        { headline: 'Offer Abhishekam Seva this Janmashtami 🙏', body: 'Sponsor the sacred Maha Abhishekam of Sri Krishna. Your seva from ₹2,100. 80G benefits.', cta: 'Offer Seva' },
        { headline: 'Be part of Sri Krishna Janmashtami', body: 'Join thousands of devotees. Sponsor festival seva and receive prasadam at your home.', cta: 'Donate Now' },
        { headline: 'Krishna is appearing — will you welcome Him?', body: 'Special Abhishekam sponsorship ₹11,000 with certificate & prasadam.', cta: 'Sponsor Now' }
      ] },
      { id: 'CNT-VRJ-1', campaignId: 'CMP-VRJ', channel: 'WhatsApp', status: 'approved', reviewerId: 'U-MEERA', variants: [
        { headline: 'Vrindavan Kartik Yatra 2026', body: 'Walk the sacred land of Krishna this Kartik. Early-bird ₹18,000 all-inclusive. Limited seats.', cta: 'Register' }
      ] },
      { id: 'CNT-GAU-1', campaignId: 'CMP-GAU', channel: 'Meta Ad', status: 'draft', reviewerId: 'U-MEERA', variants: [
        { headline: 'Protect the sacred cows 🐄', body: 'Your Gau Seva feeds and shelters Krishna\'s beloved cows. Sponsor a cow from ₹5,100/month.', cta: 'Sponsor Gau Seva' }
      ] }
    ];
  }

  /* ---------------- assemble ---------------- */
  function build() {
    var camp = buildCampaigns();
    var cd = buildContacts();
    var scripts = buildScripts();
    var calls = buildCalls(cd.contacts, scripts);
    var tasks = buildTasks(calls, cd.contacts);
    var whatsapp = buildWhatsApp(calls, cd.contacts);
    var escalations = buildEscalations(calls);
    var merges = buildMergeCandidates(cd.contacts);
    return {
      meta: { generatedAt: U.now().toISOString(), version: '1.0' },
      centers: CENTERS, departments: DEPTS, roles: ROLES, users: USERS, sources: SOURCES,
      campaigns: camp,
      contacts: cd.contacts, donors: cd.donors, yatris: cd.yatris, leads: cd.leads,
      suppression: cd.suppression,
      scripts: scripts, calls: calls, tasks: tasks,
      waTemplates: WA_TEMPLATES, whatsapp: whatsapp,
      escalations: escalations, merges: merges,
      imports: buildImports(), apiRegistry: buildApiRegistry(),
      approvals: buildApprovals(), audit: buildAudit(),
      usage: buildUsage(),
      landingPages: buildLandingPages(), content: buildContent()
    };
  }

  return { build: build };
})();
