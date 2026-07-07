export const LISTS = {
  PROCESSES:        'Processes',
  PROCESS_STEPS:    'ProcessStep',
  FIELD_CONFIG:     'FieldConfig',
  MENU_GROUP:       'Menu_Group',
  MENU_ITEMS:       'Menu_Items',
  MAIL_TEMPLATES:   'MailTemplates',
  LEAVE_OF_ABSENCE: 'LeaveOfAbsence',
  REQUESTS:         'Requests',
  EMPLOYEES:        'Employees',
  COMMENTS:         'Comments',
  MAIL_HISTORY:     'MailHistory',
  MAIL_DEADLINE:    'MailDeadline',
} as const;
 
export type ListName = typeof LISTS[keyof typeof LISTS];
 