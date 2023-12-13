import { User } from "./user-type";

export interface Post {
    id?: number;
    title: string;
    body?: string;
    userId?: number;
    user?: User;
}