// Original example screens for the v3 prototype. Each is drawn in HTML at 480 px wide and rendered
// to AVIF and WebP by render-screens.mjs. No client names, people, logos, prices, counts or results.

const tick = '<svg viewBox="0 0 20 20" class="ic"><path d="M4 10.5 8 14.5 16 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const spark = '<svg viewBox="0 0 20 20" class="ic"><path d="M10 1.5 12 8l6.5 2-6.5 2-2 6.5L8 12l-6.5-2L8 8z" fill="currentColor"/></svg>';
const arrow = '<svg viewBox="0 0 20 20" class="ic"><path d="M4 10h11M11 5.5 15.5 10 11 14.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const blank = (c = 'currentColor') => `<span class="mark" style="background:${c}"></span>`;
const siteNav = (c = 'currentColor') => `<div class="sitenav">${blank(c)}<span class="grow"></span><span>What we do</span><span>How it works</span><span>Contact</span></div>`;
const step = (state, t, sub) => `<div class="stp ${state}"><span class="dot">${state === 'done' ? tick : ''}</span><span><b>${t}</b>${sub ? `<small>${sub}</small>` : ''}</span></div>`;
const row = (t, sub, tag, cls = '') => `<div class="row"><span class="grow"><b>${t}</b><small>${sub}</small></span><span class="tag ${cls}">${tag}</span></div>`;

const web = 'website';
const auto = 'automation';
const exp = 'expert';
const sol = 'solutions';

export const screens = [
  {
    id: 'web-bakery', service: web, h: 600, label: 'Example website',
    alt: 'Example website page with a large offer headline, an order button and simple arch shapes on a red background.',
    html: `<div class="fill" style="background:#E8472B;color:#fff;padding:24px">${siteNav('#fff')}
      <h1 class="big" style="margin-top:40px">Bread baked before you wake up.</h1>
      <span class="btn" style="background:#fff;color:#141414;margin-top:24px">Order for tomorrow</span>
      <div class="arches"><i style="background:#F5C84C;height:190px"></i><i style="background:#FFF0DC;height:140px"></i><i style="background:#7A1D10;height:220px"></i></div></div>`,
  },
  {
    id: 'web-shop', service: web, h: 560, label: 'Example website',
    alt: 'Example online shop page with four product tiles in soft colours.',
    html: `<div class="fill" style="background:#F7F2E7;color:#1B1B1B;padding:24px">${siteNav('#1B1B1B')}
      <h2 class="mid" style="margin:28px 0 18px">New this season</h2>
      <div class="g2"><div><div class="tile" style="background:#2D6E68"><i class="s1"></i></div><p>Tall vase</p></div><div><div class="tile" style="background:#F2B134"><i class="s2"></i></div><p>Wide bowl</p></div><div><div class="tile" style="background:#D9694A"><i class="s3"></i></div><p>Dark mug</p></div><div><div class="tile" style="background:#A9CBEA"><i class="s4"></i></div><p>Plate</p></div></div></div>`,
  },
  {
    id: 'web-booking', service: web, h: 430, label: 'Example website',
    alt: 'Example booking page with a month calendar, morning and afternoon choices and a confirm button.',
    html: `<div class="fill" style="background:#0F4A36;color:#fff;padding:24px">
      <h2 class="big" style="font-size:40px">Book a visit</h2>
      <div class="card" style="margin-top:18px;color:#141414"><div class="cal-h"><b>March</b><span>‹ ›</span></div>
      <div class="cal">${[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((d) => `<span class="${d === 6 ? 'on' : d > 13 ? 'off' : ''}">${d}</span>`).join('')}</div>
      <div class="opts"><span>Morning</span><span class="on">Midday</span><span>Afternoon</span></div></div>
      <span class="btn wide" style="background:#C6F26B;color:#10291E;margin-top:16px">Confirm booking</span></div>`,
  },
  {
    id: 'web-clear', service: web, h: 620, label: 'Example website',
    alt: 'Example website page with an offer, a process section and a contact action.',
    html: `<div class="fill" style="background:#EAF1FF;color:#10204A;padding:24px">${siteNav('#10204A')}
      <h2 class="big" style="font-size:44px;margin-top:32px">Plans that are easy to follow.</h2>
      <span class="btn" style="background:#1B4FD8;color:#fff;margin-top:20px">Contact us</span>
      <h3 style="margin:32px 0 12px;font-size:20px">How it works</h3>
      <div class="list" style="color:#141414">${step('done', 'Tell us what you need')}${step('done', 'Review the plan')}${step('', 'Start the work')}</div></div>`,
  },
  {
    id: 'ai-assistant', service: auto, h: 600, label: 'Example AI assistant',
    alt: 'Example AI assistant summarising a contract and flagging the renewal notice for a person to check.',
    html: `<div class="fill" style="background:#F1EEFF;color:#141414;padding:24px"><div class="hd"><span class="tile-ic" style="background:#6D3FE8">${spark}</span><b>Assistant</b></div>
      <div class="bub me" style="margin-top:20px">Summarise this contract and flag the renewal terms.</div>
      <div class="card" style="margin-top:16px"><b style="font-size:19px">Here is the short version</b><p style="margin-top:6px">The contract renews by itself unless it is cancelled in writing.</p>
      <div class="note"><b>Renewal notice</b><small>Check the notice period before signing.</small></div><small style="color:#4B2FC0;font-weight:600;display:block;margin-top:12px">Source: section on renewal</small></div>
      <div class="ask">Ask a follow-up… <span class="tile-ic sm" style="background:#6D3FE8">${arrow}</span></div></div>`,
  },
  {
    id: 'ai-inbox', service: auto, h: 580, label: 'Example automation',
    alt: 'Example shared inbox where an assistant has sorted requests by type and marked what needs a person.',
    html: `<div class="fill" style="background:#fff;color:#141414;padding:24px"><h2 class="mid">Shared inbox</h2><small class="sub">Sorted by your assistant</small>
      <div class="rows" style="margin-top:12px">${row('Invoice received', 'Filed. Waiting for approval', 'Invoice', 'g')}${row('Cannot log in', 'Reply drafted. Ready to review', 'Support', 'b')}${row('Quote request', 'Details added to the tracker', 'Sales', 'o')}${row('Delivery change', 'Needs a person to decide', 'Orders', 'v')}${row('Contract renewal', 'Summary attached', 'Legal', 'y')}</div></div>`,
  },
  {
    id: 'ai-run', service: auto, h: 540, label: 'Example automation',
    alt: 'Example automation run on a new invoice, with finished steps ticked and the approval step in progress.',
    html: `<div class="fill" style="background:#14121F;color:#fff;padding:24px"><span class="tag v" style="background:#3A2C7A;color:#fff">Running</span><h2 class="mid" style="margin:14px 0 18px">New invoice received</h2>
      <div class="drk">${step('done', 'Read the attachment')}${step('done', 'Match the purchase order')}${step('done', 'Check the totals')}${step('act', 'Prepare the approval')}${step('off', 'Send to a person to approve')}</div></div>`,
  },
  {
    id: 'ai-draft', service: auto, h: 490, label: 'DRAFT · Scripted example',
    alt: 'Example website request with a draft reply marked Needs review and Not sent.',
    html: `<div class="fill" style="background:#F6F4FF;color:#141414;padding:24px"><small class="sub">Example incoming request</small><div class="card" style="margin-top:8px"><p>I need help updating the pages on my website. What information should I send?</p></div>
      <div class="hd" style="margin-top:20px"><span class="tag v">Draft reply · Needs review</span></div>
      <div class="card" style="margin-top:10px;border:2px solid #6D3FE8"><p>Thanks for getting in touch about your website. Which pages would you like to update, and what should change? Please share your website address if you have one.</p>
      <div class="kv"><span>Service</span><b>Website creation</b></div><div class="kv"><span>Status</span><b>Not sent</b></div></div></div>`,
  },
  {
    id: 'ai-approve', service: auto, h: 500, label: 'Example automation',
    alt: 'Example approval step: an assistant has read a document and a person chooses to approve it or ask a question.',
    html: `<div class="fill" style="background:#ECE9FF;color:#141414;padding:24px"><span class="tag v">Needs your review</span><h2 class="big" style="font-size:38px;margin:14px 0 18px">Read by AI. Approved by you.</h2>
      <div class="card"><div class="kv"><span>Order match</span><b style="color:#0B7A4B">Found</b></div><div class="kv"><span>Totals</span><b style="color:#0B7A4B">Correct</b></div></div>
      <div class="hd" style="margin-top:16px;gap:10px"><span class="btn" style="background:#141414;color:#fff">Approve</span><span class="btn" style="background:#fff;color:#141414;box-shadow:inset 0 0 0 1.5px #141414">Ask a question</span></div></div>`,
  },
  {
    id: 'exp-request', service: exp, h: 500, label: 'Example support request',
    alt: 'Example support request with a problem description, attempted fixes and questions for an expert.',
    html: `<div class="fill" style="background:#FFF5EE;color:#141414;padding:24px"><h2 class="mid" style="margin-bottom:14px">My support request</h2>
      <div class="card"><small class="sub" style="color:#A8360A">What I need help with</small><p>Our contact form stopped sending messages after an update.</p></div>
      <div class="card" style="margin-top:12px"><small class="sub" style="color:#A8360A">What I have tried</small><p>Restored the old settings and sent test messages.</p></div>
      <div class="card" style="margin-top:12px"><small class="sub" style="color:#A8360A">Questions to discuss</small><p>Where should we look next? How can we test it safely?</p></div></div>`,
  },
  {
    id: 'exp-session', service: exp, h: 450, label: 'Example support session',
    alt: 'Example support session with a terminal check and an expert explaining that a certificate had expired.',
    html: `<div class="fill" style="background:#FFF8F2;color:#141414;padding:24px"><div class="hd"><b style="font-size:20px">Support session</b><span class="grow"></span><span class="tag" style="background:#C2410C;color:#fff">In progress</span></div>
      <div class="term">$ check-certificate site<br><em>expired</em><br>$ renew-certificate site<br><u>renewed, valid again</u></div>
      <div class="bub ex"><small style="color:#A8360A;font-weight:600;display:block">Your expert</small>The site certificate had expired. It is renewed, and I have set it to renew by itself.</div>
      <div class="bub me dk">Thanks. Can you send me the steps?</div></div>`,
  },
  {
    id: 'exp-notes', service: exp, h: 470, label: 'Example session notes',
    alt: 'Example session notes listing what was found, what was changed and the next step.',
    html: `<div class="fill" style="background:#FFFDF9;color:#141414;padding:24px"><small class="sub" style="color:#A8360A">Session notes</small><h2 class="big" style="font-size:36px;margin:6px 0 18px">Contact form fixed</h2>
      <b style="font-size:18px">What we found</b><p style="margin:4px 0 16px;color:#444">An update changed the mail settings, so messages were rejected.</p>
      <b style="font-size:18px">What we changed</b><p style="margin:4px 0 16px;color:#444">Restored the settings and added a test message.</p>
      <div class="note" style="background:#FFEDE1"><b>Next step</b><small>Check the test message after the next update.</small></div></div>`,
  },
  {
    id: 'exp-start', service: exp, h: 600, label: 'Example support request',
    alt: 'Example form asking what the visitor needs help with, with a message box and a Book an expert button.',
    html: `<div class="fill" style="background:#FFB184;color:#141414;padding:24px"><h2 class="big" style="font-size:42px">What do you need help with?</h2>
      <div class="card" style="margin-top:20px;flex:1"><div class="chips"><span class="on">Advice</span><span>Troubleshooting</span><span>Hands-on help</span></div>
      <div class="field">Our contact form stopped sending messages after an update.</div>
      <span class="btn wide" style="background:#C2410C;color:#fff;margin-top:14px">Book an expert</span></div></div>`,
  },
  {
    id: 'sol-tool', service: sol, h: 510, label: 'Example internal tool',
    alt: 'Example internal tool showing request details alongside a Review needed status.',
    html: `<div class="fill" style="background:#EAF6F0;color:#141414;padding:24px"><small class="sub" style="color:#0B6E44">Requests</small>
      <div class="chips" style="margin:8px 0 14px"><span class="on g">Review needed</span><span>In progress</span><span>Done</span></div>
      <div class="card"><div class="hd"><b style="font-size:20px">Equipment request</b><span class="grow"></span><span class="tag y">Review needed</span></div>
      <small class="sub" style="margin-top:14px">Details</small><div class="kv"><span>Team</span><b>Operations</b></div><div class="kv"><span>Type</span><b>New equipment</b></div><div class="kv"><span>Needed by</span><b>Next month</b></div>
      <small class="sub" style="margin-top:14px">Review</small><p>Waiting for a manager to check the request.</p></div>
      <div class="hd" style="margin-top:14px;gap:10px"><span class="btn" style="background:#0B7A4B;color:#fff">Approve</span><span class="btn" style="background:#fff;color:#141414">Send back</span></div></div>`,
  },
  {
    id: 'sol-plan', service: sol, h: 490, label: 'Example project plan',
    alt: 'Example project plan with stages from understanding the work to handover, one marked in progress.',
    html: `<div class="fill" style="background:#E9F0FF;color:#141414;padding:24px"><h2 class="big" style="font-size:38px">Project plan</h2><small class="sub">Order system, example project</small>
      <div class="list" style="margin-top:16px">${step('done', 'Understand the work', 'Agreed with your team')}${step('done', 'Design the solution', 'Approved')}${step('now', 'Build and test', 'In progress')}${step('', 'Hand over', 'Next')}</div></div>`,
  },
  {
    id: 'sol-portal', service: sol, h: 520, label: 'Example client portal',
    alt: 'Example client portal with open requests, documents and project status in one place.',
    html: `<div class="fill" style="background:#0E4F3A;color:#fff;padding:24px"><small class="sub" style="color:#BFE8D5">Client portal</small><h2 class="big" style="font-size:38px;margin:6px 0 18px">Everything for your project</h2>
      <div class="card" style="color:#141414"><b style="font-size:18px">Open requests</b><small class="sub">Update the price list</small></div>
      <div class="card" style="color:#141414;margin-top:10px"><b style="font-size:18px">Documents</b><small class="sub">Agreement, plan, handover</small></div>
      <div class="card" style="color:#141414;margin-top:10px"><b style="font-size:18px">Project status</b><div class="bar"><i></i></div><small class="sub">Building</small></div></div>`,
  },
  {
    id: 'wide-studio', service: web, w: 800, h: 500, label: 'Example website',
    alt: 'Example studio website with a large headline, a call to action and four colourful shapes.',
    html: `<div class="fill" style="background:#17171C;color:#fff;padding:28px 36px">${siteNav('#fff')}
      <div class="hd" style="margin-top:36px;align-items:flex-start;gap:32px"><div style="flex:1"><h1 class="big" style="font-size:68px">Rooms that make sense.</h1><span class="btn" style="background:#fff;color:#141414;margin-top:24px">See projects</span></div>
      <div class="shapes"><i style="background:#FF7350;border-radius:0 60px 0 60px"></i><i style="background:#F5C84C;border-radius:60px 0 0 0"></i><i style="background:#3B7BF0;border-radius:0 0 60px 0"></i><i style="background:#ECE6DA;border-radius:0 0 0 60px"></i></div></div></div>`,
  },
  {
    id: 'wide-flows', service: auto, w: 800, h: 500, label: 'Example automation',
    alt: 'Example automations list showing what starts each workflow and whether it is on or needs review.',
    html: `<div class="fill split"><aside style="background:#F4F3F8"><b style="font-size:17px">Automations</b><span class="on">All workflows</span><span>Runs</span><span>Approvals</span><span>Connections</span></aside>
      <div class="main"><div class="hd"><h2 class="mid">Workflows</h2><span class="grow"></span><span class="btn" style="background:#6D3FE8;color:#fff;padding:9px 16px;font-size:15px">New workflow</span></div>
      <div class="tbl"><div class="th"><span>Name</span><span>Starts when</span><span>Status</span></div>
      <div><b>Invoice intake</b><span>Email arrives</span><span class="tag g">On</span></div><div><b>Quote follow-up</b><span>Form is sent</span><span class="tag g">On</span></div><div><b>Weekly report</b><span>Every Monday</span><span class="tag g">On</span></div><div><b>Ticket sorting</b><span>Ticket opens</span><span class="tag y">Review</span></div><div><b>Contract reminders</b><span>Before renewal</span><span class="tag">Off</span></div></div></div></div>`,
  },
  {
    id: 'wide-board', service: sol, w: 800, h: 500, label: 'Example team board',
    alt: 'Example team board with work grouped under To do, Doing and Done.',
    html: `<div class="fill" style="background:#F2F6FA;color:#141414;padding:28px 32px"><div class="hd"><h2 class="mid">Team board</h2><span class="grow"></span><span class="btn" style="background:#0A6CD6;color:#fff;padding:9px 16px;font-size:15px">Add task</span></div>
      <div class="board"><div><small class="sub">To do</small><div class="card"><b>Import price list</b><span class="tag b">Data</span></div><div class="card"><b>Staff login</b><span class="tag v">Access</span></div></div>
      <div><small class="sub">Doing</small><div class="card"><b>Order screen</b><span class="tag y">Build</span></div><div class="card"><b>Stock alerts</b><span class="tag y">Build</span></div></div>
      <div><small class="sub">Done</small><div class="card"><b>Requirements</b><span class="tag g">Agreed</span></div><div class="card"><b>First design</b><span class="tag g">Agreed</span></div></div></div></div>`,
  },
  {
    id: 'wide-orders', service: sol, w: 800, h: 500, label: 'Example internal tool',
    alt: 'Example internal orders tool with a side menu and a table of order statuses.',
    html: `<div class="fill split"><aside style="background:#0D3B73;color:#fff"><b style="font-size:17px">Operations</b><span class="on">Orders</span><span>Stock</span><span>Customers</span><span>Reports</span></aside>
      <div class="main"><h2 class="mid">Orders</h2><div class="tbl" style="margin-top:12px"><div class="th"><span>Order</span><span>Item</span><span>Status</span></div>
      <div><b>Order A</b><span>Example item</span><span class="tag g">Shipped</span></div><div><b>Order B</b><span>Example item</span><span class="tag b">Packing</span></div><div><b>Order C</b><span>Example item</span><span class="tag b">Packing</span></div><div><b>Order D</b><span>Example item</span><span class="tag o">On hold</span></div><div><b>Order E</b><span>Example item</span><span class="tag">New</span></div></div></div></div>`,
  },
];

export const screenCss = `
*{box-sizing:border-box;margin:0}
body{margin:0;font:400 17px/1.4 'Public Sans',Arial,sans-serif;-webkit-font-smoothing:antialiased;background:#888}
.scr{width:480px;overflow:hidden;position:relative;display:flex;margin-bottom:10px}
.fill{flex:1;display:flex;flex-direction:column;min-width:0;position:relative}
.big{font-size:56px;line-height:1.02;letter-spacing:-.035em;font-weight:680}
.mid{font-size:30px;line-height:1.1;letter-spacing:-.025em;font-weight:680}
.grow{flex:1}
.ic{width:1em;height:1em;display:block}
.mark{width:26px;height:26px;border-radius:8px;display:block}
.sitenav{display:flex;align-items:center;gap:16px;font-weight:600;font-size:15px}
.btn{display:inline-flex;align-self:flex-start;align-items:center;justify-content:center;padding:12px 22px;border-radius:999px;font-weight:600;font-size:17px;white-space:nowrap}
.btn.wide{align-self:stretch}
.arches{position:absolute;left:24px;right:24px;bottom:0;display:flex;align-items:flex-end;gap:14px}
.arches i{flex:1;border-radius:200px 200px 0 0;display:block}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.g2 p{font-weight:600;font-size:16px;margin-top:6px}
.tile{height:130px;border-radius:14px;display:flex;align-items:center;justify-content:center}
.tile i{display:block}
.s1{width:58px;height:90px;background:#F7D9AE;border-radius:40px 40px 10px 10px}
.s2{width:110px;height:56px;background:#FFF6E6;border-radius:0 0 80px 80px}
.s3{width:66px;height:70px;background:#2A1C18;border-radius:14px}
.s4{width:88px;height:88px;background:#fff;border-radius:50%}
.card{background:#fff;border-radius:16px;padding:16px;color:#141414;box-shadow:0 1px 2px #0000000f}
.card p{font-size:17px}
.cal-h{display:flex;justify-content:space-between;margin-bottom:10px}
.cal{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;text-align:center}
.cal span{padding:7px 0;border-radius:999px}
.cal .on{background:#0F4A36;color:#fff;font-weight:600}
.cal .off{color:#999}
.opts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px;text-align:center;font-weight:600;font-size:15px}
.opts span{padding:9px 0;border-radius:12px;box-shadow:inset 0 0 0 1.5px #bbb}
.opts .on{background:#C6F26B;box-shadow:none}
.list{display:flex;flex-direction:column;gap:10px}
.stp{display:flex;align-items:center;gap:14px;background:#fff;border-radius:14px;padding:14px 16px;color:#141414}
.stp b{display:block;font-weight:600;font-size:18px}
.stp small{display:block;color:#555;font-size:15px}
.stp .dot{width:28px;height:28px;border-radius:50%;background:#D9D9D9;display:flex;align-items:center;justify-content:center;color:#fff;flex:none;font-size:16px}
.stp.done .dot{background:#0B7A4B}
.stp.now{background:#0A6CD6;color:#fff}
.stp.now b,.stp.now small{color:#fff}
.stp.now .dot{background:#fff}
.drk{display:flex;flex-direction:column;gap:10px}
.drk .stp{background:#23202F;color:#fff}
.drk .stp b{color:#fff}
.drk .stp.act{background:#3A2C7A}
.drk .stp.act .dot{background:#6D3FE8;box-shadow:0 0 0 4px #6D3FE855}
.drk .stp.off b{color:#9b98ab}
.drk .stp.off .dot{background:#3a3748}
.hd{display:flex;align-items:center;gap:12px}
.tile-ic{width:36px;height:36px;border-radius:11px;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;flex:none}
.tile-ic.sm{width:28px;height:28px;border-radius:50%;font-size:16px}
.bub{padding:12px 16px;border-radius:18px;font-size:17px}
.bub.me{background:#6D3FE8;color:#fff;align-self:flex-end;max-width:84%;border-bottom-right-radius:6px}
.bub.me.dk{background:#141414;margin-top:14px}
.bub.ex{background:#fff;box-shadow:0 1px 2px #0000000f;margin-top:16px;max-width:92%}
.note{background:#FFF4D6;border-radius:12px;padding:12px 14px;margin-top:12px}
.note b{display:block}
.note small{display:block;font-size:15px;color:#444}
.ask{position:absolute;left:24px;right:24px;bottom:64px;background:#fff;border-radius:999px;padding:10px 12px 10px 18px;display:flex;justify-content:space-between;align-items:center;color:#555}
.sub{display:block;font-size:15px;color:#555;font-weight:500}
.rows{display:flex;flex-direction:column}
.row{display:flex;align-items:center;gap:12px;padding:14px 0;border-top:1px solid #E8E8E8}
.row b{display:block;font-weight:600;font-size:18px}
.row small{display:block;font-size:15px;color:#555}
.tag{display:inline-block;padding:4px 12px;border-radius:999px;font-size:14px;font-weight:600;background:#EDEDED;color:#333;white-space:nowrap;align-self:center}
.tag.g{background:#D9F2E5;color:#075E39}
.tag.b{background:#DCE9FF;color:#123F9B}
.tag.o{background:#FFE3D6;color:#8F2F08}
.tag.v{background:#E7E0FF;color:#4322B5}
.tag.y{background:#FFF0C7;color:#664700}
.kv{display:flex;justify-content:space-between;padding-top:10px;font-size:16px}
.kv span{color:#555}
.term{background:#14171F;color:#D5D9E2;border-radius:14px;padding:14px 16px;margin-top:16px;font:500 15px/1.6 ui-monospace,Menlo,Consolas,monospace}
.term em{color:#FF8F6B;font-style:normal}
.term u{color:#9FE8B5;text-decoration:none}
.chips{display:flex;gap:8px;flex-wrap:wrap}
.chips span{padding:7px 14px;border-radius:999px;background:#F1F1F1;font-weight:600;font-size:15px;color:#141414}
.chips .on{background:#141414;color:#fff}
.chips .on.g{background:#0B7A4B}
.field{margin-top:14px;border-radius:12px;box-shadow:inset 0 0 0 1.5px #bbb;padding:12px 14px;min-height:150px}
.bar{height:10px;border-radius:9px;background:#E6E6E6;margin:10px 0 6px;overflow:hidden}
.bar i{display:block;width:60%;height:100%;background:#0B7A4B}
.shapes{width:290px;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.shapes i{display:block;height:150px}
.split{flex-direction:row;background:#fff;color:#141414}
.split aside{width:200px;padding:24px 16px;display:flex;flex-direction:column;gap:6px;font-size:16px;font-weight:500}
.split aside b{margin-bottom:12px}
.split aside span{padding:8px 12px;border-radius:10px}
.split aside .on{background:#141414;color:#fff}
.main{flex:1;padding:24px 28px;min-width:0}
.tbl{display:flex;flex-direction:column;margin-top:12px;font-size:16px}
.tbl>div{display:grid;grid-template-columns:1.3fr 1.1fr 72px;gap:10px;align-items:center;padding:11px 0;border-top:1px solid #ECECEC}
.tbl b{font-weight:600}
.tbl .tag{justify-self:start;font-size:13px;padding:3px 10px}
.tbl .th{border:0;color:#666;font-size:14px;padding:4px 0}
.board{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:18px}
.board .card{margin-top:10px;display:flex;flex-direction:column;gap:12px;align-items:flex-start;padding:16px}
.board b{font-weight:600;font-size:17px}
`;
