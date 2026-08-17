export interface CartItemDto {
    productId : number;
    productName : string;
    unitPrice : number;
    quantity : number;
    lineTotal : number
}

export interface CartDto {
    id: number;
    userId : string;
    items : CartItemDto[];
    total : number;
}

export interface AddCartItemDto {
    productId : number;
    quantity : number;
}

export interface UpdateCartItemDto {
    quantity : number;
}