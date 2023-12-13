import { Todo } from '../../types/todo-type';
import { createApiService, CreateApiOptions } from '../../utils/create-api';

export const TodoApi = createApiService({
  authHeather: false,
  baseApiPath: 'todos2',
  endpoints: [
    {
      name: 'fetchTodos',
      method: 'GET',
      transformResponse: (data: Todo[]) => {
        return data.map((todo: Todo) => {
          return todo;
        });
      }
    },
    {
      name: 'createTodo',
      method: 'POST',
      prepareData: (data: any) => {
        return { ...data, newData: true };
      }
    } 
  ]
} as CreateApiOptions)


export const { fetchTodos, createTodo } = TodoApi;




// import { useState, useEffect} from 'react';
// import { httpService } from "../../utils/http-service";

// import { Todo } from "../../types/todo-type";

// class TodoService {
//   fetchTodos() {
//     const {data, setData} = useFetchTodos();
//     const [isLoading, setIsLoading] = useState(false);
//     const [isReady, setIsReady] = useState(false);


//     const promise = new Promise((resolve, reject) => {
//       if(!isLoading && !isReady) {
//         setIsLoading(true);
//         httpService.get('todos').then((response: any) => {
//           setIsLoading(false);
//           setIsReady(true);
//           setData(response);
//           resolve(response);
//         }).catch(err => {
//           setIsLoading(false);
//           setIsReady(true);
//           reject(err);
//         })
//       }
//     });

//     return { data, promise, isLoading };
//   }
// }

// export const { fetchTodos } = new TodoService();

// function useFetchTodos() {
//   const [data, setData] = useState<undefined|Todo[]>();

//   useEffect(() => {}, [data]);

//   const updateValue = (newValue: any) => {
//     if(data !== newValue) {
//       setData(newValue);  
//     }
//   };

//   return {
//     data,
//     setData: updateValue,
//   };
// }