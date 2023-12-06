import { User } from "./user-type";

export interface Todo {
    id?: number;
    title: string;
    description?: string;
    userId?: number;
    user?: User;
}