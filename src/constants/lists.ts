export const LISTS = {
  PROCESSES:        'Processes',
  PROCESS_STEPS:    'ProcessStep',
  FIELD_CONFIG:     'FieldConfig',
  MAIL_TEMPLATES:   'MailTemplates',
  LEAVE_OF_ABSENCE: 'LeaveOfAbsence',
  REQUESTS:         'Requests',
  EMPLOYEES:        'Employees',
  COMMENTS:         'Comments',
  MAIL_HISTORY:     'MailHistory',
  MAIL_DEADLINE:    'MailDeadline',
} as const;
 
export type ListName = typeof LISTS[keyof typeof LISTS];
 