export interface LoginDto {
    email: string;
    password: string;
}

export interface RegisterDto {
    email: string;
    password: string;
    fullName: string;
}

export interface AuthResponseDto {
    token: string;
    expiresAt: string;
    email: string;
    fullName: string;
    roles: string[];
}