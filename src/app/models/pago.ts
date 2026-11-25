export interface IniciarPagoRequest {
  clientId: string;      
  amount: number;       
  transactionId: string; 
}

export interface IniciarPagoResponse {
  token?: string;       
  url?: string;          
  status?: string;      
  message?: string;      
}