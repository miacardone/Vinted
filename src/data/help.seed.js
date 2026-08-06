/**
 * Help centre content: video tiles, docs and guides, FAQ accordion.
 * Written to be tenant-neutral — no product name appears in the copy.
 */

export const HELP_VIDEOS = [
  {
    id: 'vid_01',
    title: 'Working your first case',
    description: 'The three-column layout, the document viewer and recording a decision.',
    duration: '6:12',
    level: 'Getting started',
  },
  {
    id: 'vid_02',
    title: 'Understanding consolidation',
    description: 'Why cases get linked, and what to do when an order is disputed twice.',
    duration: '4:48',
    level: 'Getting started',
  },
  {
    id: 'vid_03',
    title: 'Building a routing rule',
    description: 'Criteria, actions and details in the add-rule wizard.',
    duration: '8:31',
    level: 'Intermediate',
  },
  {
    id: 'vid_04',
    title: 'Bulk actions without breaking things',
    description: 'Using the live match count to check scope before you apply.',
    duration: '5:07',
    level: 'Intermediate',
  },
  {
    id: 'vid_05',
    title: 'Custom reports and scheduling',
    description: 'Picking fields, previewing output and setting up recurring delivery.',
    duration: '7:24',
    level: 'Intermediate',
  },
  {
    id: 'vid_06',
    title: 'Reading the monitoring dashboards',
    description: 'Document processing, outcomes and what the error types mean.',
    duration: '5:52',
    level: 'Advanced',
  },
];

export const HELP_DOCS = [
  { id: 'doc_01', title: 'Reason code reference', description: 'Every Visa and Mastercard code the console handles, with evidence requirements.', category: 'Reference', readingMinutes: 14 },
  { id: 'doc_02', title: 'Due dates and internal buffers', description: 'How network windows, cycles and the internal buffer combine.', category: 'Reference', readingMinutes: 6 },
  { id: 'doc_03', title: 'Evidence that actually wins', description: 'What issuers accept for non-receipt and not-as-described disputes.', category: 'Playbook', readingMinutes: 11 },
  { id: 'doc_04', title: 'Consolidation thresholds explained', description: 'Why the seller rule needs three cases and the card rule needs two.', category: 'Playbook', readingMinutes: 7 },
  { id: 'doc_05', title: 'CSV import specification', description: 'Column-by-column reference for case uploads.', category: 'Reference', readingMinutes: 9 },
  { id: 'doc_06', title: 'Webhook payload schemas', description: 'Every topic, its payload and delivery guarantees.', category: 'Integration', readingMinutes: 12 },
  { id: 'doc_07', title: 'Roles and permissions model', description: 'What each role can do, and how group membership interacts.', category: 'Administration', readingMinutes: 8 },
  { id: 'doc_08', title: 'Writing off responsibly', description: 'When accepting the loss is the correct commercial decision.', category: 'Playbook', readingMinutes: 5 },
];

export const HELP_FAQ = [
  {
    id: 'faq_01',
    question: 'Why does a chargeback show marketplace details like the item and seller?',
    answer:
      'Because you usually cannot defend a card dispute without them. A “not as described” reason code is an argument about the listing, so the listing, its photos and the seller’s history sit on the case alongside the ARN. Both intake paths share one record shape for exactly this reason.',
  },
  {
    id: 'faq_02',
    question: 'What does the consolidation flag actually mean?',
    answer:
      'That this case is linked to at least one other by card, order or seller. The panel shows what linked them, how many cases are in the group and the total exposure across all of them. If the group is cross-channel, the same order is being disputed through two channels at once — resolve it as one decision or you risk refunding it twice.',
  },
  {
    id: 'faq_03',
    question: 'Why are only some cases flagged for consolidation?',
    answer:
      'The thresholds are deliberately conservative: two cases on one card, two on one order, but three on one seller and only if they are open and inside 30 days. Loosening them would flag most of the book, and a flag on everything carries no information.',
  },
  {
    id: 'faq_04',
    question: 'What is the difference between the internal due date and the network due date?',
    answer:
      'The network due date is the scheme’s hard deadline. The internal due date is that date minus a configurable buffer, so there is time to fix a rejected submission. Analysts work to the internal date; both are shown on the case.',
  },
  {
    id: 'faq_05',
    question: 'Why did my rule not fire on a case I expected it to match?',
    answer:
      'Run it through Rule check. It evaluates each criterion separately and shows which ones passed, so a rule that matched five of six criteria tells you exactly which one to change.',
  },
  {
    id: 'faq_06',
    question: 'Does the bulk-action match count reflect real cases?',
    answer:
      'Yes. The wizard evaluates your criteria against the live book as you build them, using the same engine the rules use. The number you see in the review step is the number of cases that will be changed.',
  },
  {
    id: 'faq_07',
    question: 'Can I recover a case after archiving it?',
    answer:
      'Archived is a view, not a state. Cases appear there once they reach a closed status, and they remain fully readable. Reopening requires the case-handling permission and is recorded in the case history.',
  },
  {
    id: 'faq_08',
    question: 'How do I schedule a report?',
    answer:
      'Scheduling is the last step of the report builder rather than a separate page. Choose on-demand or recurring, set the frequency and recipients, and the schedule is saved with the report definition.',
  },
];

export const HELP_CONTACT_TOPICS = [
  { id: 'access', label: 'Access or permissions' },
  { id: 'case_data', label: 'Case data looks wrong' },
  { id: 'rules', label: 'Rules and automation' },
  { id: 'integration', label: 'API or webhooks' },
  { id: 'billing', label: 'Billing and contract' },
  { id: 'other', label: 'Something else' },
];
