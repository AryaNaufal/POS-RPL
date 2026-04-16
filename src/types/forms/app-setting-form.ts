export type AppSettingKey =
  | 'company_name'
  | 'company_address'
  | 'company_phone'
  | 'invoice_prefix'
  | 'tax_percentage'
  | 'footer_note';

export type UpdateAppSettingInput = Record<string, any>;
