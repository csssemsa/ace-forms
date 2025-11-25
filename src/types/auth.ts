export interface User {
    id: string;
    name: string;
    cpf: string;
    cns: string;
    microArea: string;
    password?: string;
    role: 'admin' | 'user';
}

export interface AuthContextType {
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}
