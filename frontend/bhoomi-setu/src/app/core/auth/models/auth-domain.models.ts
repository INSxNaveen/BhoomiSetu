export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  organizationName: string;
  stateId?: string;
  stateName?: string;
  districtId?: string;
  districtName?: string;
  permissions: string[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  module: string;
}
