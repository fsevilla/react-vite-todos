import { styled } from 'styled-components';


export const NavIconContainer = styled.div`
    float: right;
    position: relative;
    top: 30px;

    .has-notifications {
        &::after {
            content: "";
            display: block;
            width: 8px;
            height: 8px;
            background-color: rgb(255, 37, 37);
            border-radius: 50%;
            position: absolute;
            top: -3px;
            right: -3px;
        }
    }

    .menu {
        position: absolute;
        display: none;
        color: #000;
        background-color: #fff;
        padding: 10px;
        border: solid 1px #999;
        width: 200px;
        right: 0;
        top: 25px;

        &.opened {
            display: block;
        }
    }
`;
