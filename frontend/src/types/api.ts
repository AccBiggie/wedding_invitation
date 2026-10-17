export interface ApiResponse<T> { success: boolean; message?: string; data: T }
export interface Pagination { page: number; limit: number; total: number; totalPages: number }
export interface ListData<T> { data: T[]; pagination: Pagination }
export interface ListFilters { name?: string; active?: boolean | ''; page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
export interface Godparent { _id: string; name: string; role: 'groomsman' | 'bridesmaid' | 'mother' | 'father' | 'other'; phone: string; email: string; description: string; image: string; order: number; active: boolean; createdAt: string; updatedAt: string }
export type GodparentInput = Omit<Godparent, '_id' | 'createdAt' | 'updatedAt'>;
export interface GiftProduct { _id: string; name: string; description: string; price: number; image: string; category: string; active: boolean; order: number; createdAt: string; updatedAt: string }
export type GiftInput = Omit<GiftProduct, '_id' | 'createdAt' | 'updatedAt'>;
export interface PixSettings { _id: string; keyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'; pixKey: string; receiverName: string; receiverCity: string; description: string; active: boolean; createdAt: string; updatedAt: string }
export type PixInput = Omit<PixSettings, '_id' | 'createdAt' | 'updatedAt'>;
export interface PixGenerated { amount: number; payload: string; qrCode: string }
export interface Invitation { _id: string; name: string; status: 'confirmed' | 'unconfirmed'; guests: { confirmed: boolean }[] }
export interface InvitationListData extends ListData<Invitation> { summary: { total: number; people: number; confirmed: number; unconfirmed: number } }
