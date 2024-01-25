import { styled } from 'styled-components';

export const TodoItemContainer = styled.div`
    border: solid 1px gray;
    border-radius: 5px;
    margin-bottom: 10px;
    width: 300px;
    box-sizing: border-box;
    padding: 10px;
`;

export const NarrowTodoItemContainer = styled(TodoItemContainer)`
    width: 200px;
`;