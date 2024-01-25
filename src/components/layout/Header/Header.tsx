import { useContext, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

import { NotificationsContext } from '../../../store/notifications-context';

import styles from './header.module.css';
import NotificationsList from '../../elements/NotificationsList/NotificationsList';
import NavIcon from '../../elements/NavIcon/NavIcon';

export default function Header() {

    const { unreadNotifications } = useContext(NotificationsContext);

    const menuItems: MenuItem[] = [
        {
            label: 'About',
            path: '/about'
        },
        {
            label: 'Test',
            path: '/test'
        },
        // {
        //     label: 'Services',
        //     path: '/services'
        // },
        // {
        //     label: 'Portfolio',
        //     path: '/products'
        // }
    ]

    useEffect(() => {
        console.log('There is a new unread notification?', unreadNotifications);
    }, [unreadNotifications]);

    return (
        <header>
            <NavLink to="/" className={styles['app-name']}>My App</NavLink>
            <ul className={styles.menu}>
                {
                    menuItems.map((item: MenuItem) => {
                        return (
                            <li key={item.path}>
                                <NavLink to={item.path}>{item.label}</NavLink>
                            </li>
                        )
                    })
                }
            </ul>
            <button className={`${styles['notifications-icon']} ${unreadNotifications.length ? styles['has-notifications'] : ''}`}>Notifications</button>
            <NavIcon
                label='Notifications'
                hasNotifications={unreadNotifications.length > 0}
            >
                <NotificationsList />
            </NavIcon>
            
        </header>
    )
}

type MenuItem = {
    label: string,
    path: string
}