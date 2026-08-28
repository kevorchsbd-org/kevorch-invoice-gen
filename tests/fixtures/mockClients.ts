import { Client } from '../../src/types';

export const mockClient1: Client = {
  id: 'client_fixture_101',
  name: 'Rajesh Kumar',
  companyName: 'Apex Retail Solutions',
  mobile: '+91 98765 43210',
  email: 'client@example.com',
  ccEmails: ['accounts@example.com', 'manager@example.com', 'client@example.com', 'accounts@example.com'],
  address: '100 Crosscut Road',
  city: 'Coimbatore',
  state: 'Tamil Nadu',
  pincode: '641001',
  createdAt: '2026-08-28T00:00:00Z',
  updatedAt: '2026-08-28T00:00:00Z'
};

export const mockCompanyProfile = {
  companyName: 'KEVORCH SBD',
  email: 'info@kevorch.com',
  phone: '+91 90000 11111',
  address: '123 Tech Park',
  city: 'Coimbatore',
  state: 'Tamil Nadu',
  pincode: '641006'
};
