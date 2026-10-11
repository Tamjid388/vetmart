export const USER_ROLES = {
  admin: 'admin',
  staff: 'staff',
} as const;

export type TUserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const UserSearchableFields = ['email', 'name'];
