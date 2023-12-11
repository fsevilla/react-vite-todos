import { configureStore } from '@reduxjs/toolkit';
import { api as todoApi } from './../services/api/todo-api';
import { api as userApi } from './../services/api/user-api';

const rootReducer = {
    [todoApi.reducerPath]: todoApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
};
  
export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(
            todoApi.middleware,
            userApi.middleware
        )
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;