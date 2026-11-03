export interface Paging {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface WebResponse<T> {
  data: T;
  paging?: Paging;
  message?: string;
}
