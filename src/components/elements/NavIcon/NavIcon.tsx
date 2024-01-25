import { ReactNode } from "react";
import { useState } from "react";

import { NavIconContainer } from "./NavIconContainer";

interface NavIconProps {
    label: string;
    hasNotifications: boolean;
    children: ReactNode
}

export default function NavIcon({children, ...props}: NavIconProps) {

    const [isOpen, setIsOpen] = useState(false);

    function toggleMenu() {
        setIsOpen(!isOpen);
    }

    return <NavIconContainer>
        <button className={props.hasNotifications ? 'has-notifications' : undefined} onClick={toggleMenu}>{props.label}</button>
        <div className={`menu ${isOpen ? 'opened' : ''}`}>
            {children}
        </div>
    </NavIconContainer>
}