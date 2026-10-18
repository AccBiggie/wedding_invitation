export interface ApiResponse<T> { success: boolean; message?: string; data: T }
export interface Pagination { page: number; limit: number; total: number; totalPages: number }
export interface ListData<T> { data: T[]; pagination: Pagination }
export interface ListFilters { name?: string; active?: boolean | ''; page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
export interface Godparent { _id: string; name: string; partnerName: string; role: 'groomsman' | 'bridesmaid' | 'mother' | 'father' | 'other'; cardRole: string; phone: string; email: string; description: string; image: string; images: string[]; order: number; active: boolean; createdAt: string; updatedAt: string }
export type GodparentInput = Omit<Godparent, '_id' | 'createdAt' | 'updatedAt'>;
export interface CategoryRef { _id: string; name: string; slug: string; active: boolean }
// categoryId null so em produtos antigos ainda nao migrados; legacyCategory traz o texto antigo.
// image e a foto principal; images, as extras da galeria. storeUrl abre a pagina do produto na loja.
export interface GiftProduct { _id: string; name: string; description: string; price: number; image: string; images: string[]; storeUrl: string; categoryId: string | null; category: CategoryRef | null; legacyCategory?: string; active: boolean; order: number; createdAt: string; updatedAt: string }
export interface GiftInput { name: string; description: string; price: number; image: string; images: string[]; storeUrl: string; categoryId: string; order: number; active: boolean }
export type PublicGiftProduct = Pick<GiftProduct, '_id' | 'name' | 'description' | 'price' | 'image'> & Partial<Pick<GiftProduct, 'images' | 'storeUrl'>>;
// icon: chave de um SVG tematico (src/assets/category-icons); image, se houver, prevalece.
export interface StoreCategory { _id: string; name: string; slug: string; description: string; image: string; icon: string; active: boolean; order: number; productCount: number; createdAt: string; updatedAt: string }
export type StoreCategoryInput = Pick<StoreCategory, 'name' | 'description' | 'image' | 'icon' | 'active' | 'order'>;
export type PublicStoreCategory = Pick<StoreCategory, '_id' | 'name' | 'slug' | 'description' | 'image' | 'icon'>;
export interface PublicStoreCategoryPage { category: PublicStoreCategory; products: PublicGiftProduct[]; pagination: Pagination }
export interface PixSettings { _id: string; keyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'; pixKey: string; receiverName: string; receiverCity: string; description: string; active: boolean; createdAt: string; updatedAt: string }
export type PixInput = Omit<PixSettings, '_id' | 'createdAt' | 'updatedAt'>;
export interface PixGenerated { amount: number; payload: string; qrCode: string }
export interface Invitation { _id: string; name: string; status: 'confirmed' | 'unconfirmed'; guests: { confirmed: boolean }[] }
export interface InvitationListData extends ListData<Invitation> { summary: { total: number; people: number; confirmed: number; unconfirmed: number } }
