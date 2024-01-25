import { styled } from 'styled-components';

export const NotificationsListItemContainer = styled.div`
    color: #000;
    padding-bottom: 10px;
    
    &:not(:last-child) {
        border-bottom: solid 1px #ccc;
        margin-bottom: 10px;
    }
`;