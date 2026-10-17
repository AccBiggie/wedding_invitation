import api from './api';
import type { ApiResponse, InvitationListData } from '../types/api';
export const invitationsService = {
  list: (params: { page: number; limit: number }) => api.get<ApiResponse<InvitationListData>>('/invitations', { params }).then(r => r.data.data)
};
