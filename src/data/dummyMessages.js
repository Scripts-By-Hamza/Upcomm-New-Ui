/**
 * INITIAL SEED DATA FOR PRIVATE MESSAGING, GROUPS, BROADCAST & REPORTS
 * Matches UPCOMM Solutions Task Manager specification and mockup design.
 */

const now = new Date();
const minAgo = (mins) => new Date(now.getTime() - mins * 60 * 1000).toISOString();
const hoursAgo = (hrs) => new Date(now.getTime() - hrs * 60 * 60 * 1000).toISOString();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

export const INITIAL_CONVERSATIONS = [
  {
    id: 'conv-ahmed',
    type: 'direct',
    name: null,
    created_by: 'usr-admin-1',
    created_at: hoursAgo(24),
    updated_at: minAgo(2),
  },
  {
    id: 'conv-homepage-qa',
    type: 'group',
    name: 'Homepage QA',
    created_by: 'usr-sarah-1',
    created_at: hoursAgo(48),
    updated_at: minAgo(12),
  },
  {
    id: 'conv-sarah',
    type: 'direct',
    name: null,
    created_by: 'usr-admin-1',
    created_at: hoursAgo(72),
    updated_at: minAgo(35),
  },
  {
    id: 'conv-bilal',
    type: 'direct',
    name: null,
    created_by: 'usr-bilal-1',
    created_at: hoursAgo(96),
    updated_at: hoursAgo(1),
  },
  {
    id: 'conv-marketing',
    type: 'group',
    name: 'Marketing Campaign',
    created_by: 'usr-ali-1',
    created_at: hoursAgo(120),
    updated_at: hoursAgo(2),
  },
  {
    id: 'conv-operations',
    type: 'group',
    name: 'Operations Update',
    created_by: 'usr-admin-1',
    created_at: hoursAgo(144),
    updated_at: yesterday,
  },
];

export const INITIAL_CONVERSATION_PARTICIPANTS = [
  // conv-ahmed
  {
    id: 'cp-ahmed-1',
    conversation_id: 'conv-ahmed',
    user_id: 'usr-admin-1',
    role: 'admin',
    last_read_at: minAgo(10),
    joined_at: hoursAgo(24),
  },
  {
    id: 'cp-ahmed-2',
    conversation_id: 'conv-ahmed',
    user_id: 'usr-ahmed-1',
    role: 'member',
    last_read_at: minAgo(1),
    joined_at: hoursAgo(24),
  },

  // conv-homepage-qa
  {
    id: 'cp-qa-1',
    conversation_id: 'conv-homepage-qa',
    user_id: 'usr-admin-1',
    role: 'member',
    last_read_at: hoursAgo(5),
    joined_at: hoursAgo(48),
  },
  {
    id: 'cp-qa-2',
    conversation_id: 'conv-homepage-qa',
    user_id: 'usr-sarah-1',
    role: 'admin',
    last_read_at: minAgo(12),
    joined_at: hoursAgo(48),
  },
  {
    id: 'cp-qa-3',
    conversation_id: 'conv-homepage-qa',
    user_id: 'usr-ahmed-1',
    role: 'member',
    last_read_at: minAgo(20),
    joined_at: hoursAgo(48),
  },

  // conv-sarah
  {
    id: 'cp-sarah-1',
    conversation_id: 'conv-sarah',
    user_id: 'usr-admin-1',
    role: 'admin',
    last_read_at: minAgo(35),
    joined_at: hoursAgo(72),
  },
  {
    id: 'cp-sarah-2',
    conversation_id: 'conv-sarah',
    user_id: 'usr-sarah-1',
    role: 'member',
    last_read_at: minAgo(40),
    joined_at: hoursAgo(72),
  },

  // conv-bilal
  {
    id: 'cp-bilal-1',
    conversation_id: 'conv-bilal',
    user_id: 'usr-admin-1',
    role: 'member',
    last_read_at: hoursAgo(2),
    joined_at: hoursAgo(96),
  },
  {
    id: 'cp-bilal-2',
    conversation_id: 'conv-bilal',
    user_id: 'usr-bilal-1',
    role: 'admin',
    last_read_at: hoursAgo(1),
    joined_at: hoursAgo(96),
  },

  // conv-marketing
  {
    id: 'cp-mkt-1',
    conversation_id: 'conv-marketing',
    user_id: 'usr-admin-1',
    role: 'member',
    last_read_at: hoursAgo(3),
    joined_at: hoursAgo(120),
  },
  {
    id: 'cp-mkt-2',
    conversation_id: 'conv-marketing',
    user_id: 'usr-ali-1',
    role: 'admin',
    last_read_at: hoursAgo(2),
    joined_at: hoursAgo(120),
  },
  {
    id: 'cp-mkt-3',
    conversation_id: 'conv-marketing',
    user_id: 'usr-sarah-1',
    role: 'member',
    last_read_at: hoursAgo(2),
    joined_at: hoursAgo(120),
  },

  // conv-operations
  {
    id: 'cp-ops-1',
    conversation_id: 'conv-operations',
    user_id: 'usr-admin-1',
    role: 'admin',
    last_read_at: yesterday,
    joined_at: hoursAgo(144),
  },
  {
    id: 'cp-ops-2',
    conversation_id: 'conv-operations',
    user_id: 'usr-bilal-1',
    role: 'member',
    last_read_at: yesterday,
    joined_at: hoursAgo(144),
  },
  {
    id: 'cp-ops-3',
    conversation_id: 'conv-operations',
    user_id: 'usr-ahmed-1',
    role: 'member',
    last_read_at: yesterday,
    joined_at: hoursAgo(144),
  },
];

export const INITIAL_MESSAGES = [
  // conv-ahmed thread
  {
    id: 'msg-ahmed-1',
    conversation_id: 'conv-ahmed',
    sender_id: 'usr-ahmed-1',
    body: 'The API authentication changes are almost complete. I’m checking the final response handling now.',
    source_type: 'direct',
    reply_to_id: null,
    created_at: minAgo(60),
    is_read: true,
  },
  {
    id: 'msg-ahmed-2',
    conversation_id: 'conv-ahmed',
    sender_id: 'usr-admin-1',
    body: 'Perfect. Please send me an update once QA is complete.',
    source_type: 'direct',
    reply_to_id: null,
    created_at: minAgo(56),
    is_read: true,
  },
  {
    id: 'msg-ahmed-3',
    conversation_id: 'conv-ahmed',
    sender_id: 'usr-ahmed-1',
    body: 'Sure. I should have it ready before 3 PM.',
    source_type: 'direct',
    reply_to_id: null,
    created_at: minAgo(50),
    is_read: true,
  },
  {
    id: 'msg-ahmed-4',
    conversation_id: 'conv-ahmed',
    sender_id: 'usr-admin-1',
    body: 'Also check the mobile login flow before closing it.',
    source_type: 'direct',
    reply_to_id: null,
    created_at: minAgo(48),
    is_read: true,
  },
  {
    id: 'msg-ahmed-5',
    conversation_id: 'conv-ahmed',
    sender_id: 'usr-ahmed-1',
    body: 'Almost done with the API update.',
    source_type: 'direct',
    reply_to_id: null,
    created_at: minAgo(2),
    is_read: false,
  },

  // conv-homepage-qa
  {
    id: 'msg-qa-1',
    conversation_id: 'conv-homepage-qa',
    sender_id: 'usr-ahmed-1',
    body: 'Starting QA regression suite on mobile web.',
    source_type: 'group',
    reply_to_id: null,
    created_at: minAgo(30),
    is_read: false,
  },
  {
    id: 'msg-qa-2',
    conversation_id: 'conv-homepage-qa',
    sender_id: 'usr-sarah-1',
    body: 'Mobile version is ready.',
    source_type: 'group',
    reply_to_id: null,
    created_at: minAgo(12),
    is_read: false,
  },

  // conv-sarah
  {
    id: 'msg-sarah-1',
    conversation_id: 'conv-sarah',
    sender_id: 'usr-sarah-1',
    body: 'Could you please check the new dashboard design mockups when you get a chance?',
    source_type: 'direct',
    reply_to_id: null,
    created_at: minAgo(45),
    is_read: true,
  },
  {
    id: 'msg-sarah-2',
    conversation_id: 'conv-sarah',
    sender_id: 'usr-admin-1',
    body: "I'll review it today.",
    source_type: 'direct',
    reply_to_id: null,
    created_at: minAgo(35),
    is_read: true,
  },

  // conv-bilal
  {
    id: 'msg-bilal-1',
    conversation_id: 'conv-bilal',
    sender_id: 'usr-bilal-1',
    body: 'Can you check the supplier sheet?',
    source_type: 'direct',
    reply_to_id: null,
    created_at: hoursAgo(1),
    is_read: false,
  },

  // conv-marketing
  {
    id: 'msg-mkt-1',
    conversation_id: 'conv-marketing',
    sender_id: 'usr-ali-1',
    body: 'Final creative has been uploaded.',
    source_type: 'group',
    reply_to_id: null,
    created_at: hoursAgo(2),
    is_read: false,
  },

  // conv-operations
  {
    id: 'msg-ops-1',
    conversation_id: 'conv-operations',
    sender_id: 'usr-admin-1',
    body: 'Please send today’s progress.',
    source_type: 'group',
    reply_to_id: null,
    created_at: yesterday,
    is_read: true,
  },
];

export const INITIAL_MESSAGE_REPORTS = [
  {
    id: 'mr-1',
    message_id: 'msg-bilal-1',
    conversation_id: 'conv-bilal',
    reported_by: 'usr-admin-1',
    reported_user_id: 'usr-bilal-1',
    reason: 'Inappropriate language or harassment',
    details: 'Testing message reporting workflow',
    status: 'open',
    created_at: hoursAgo(1),
  },
];
