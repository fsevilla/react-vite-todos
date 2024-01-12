import { NavLink } from 'react-router-dom';

import styles from './header.module.css';

export default function Header() {

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

    console.log('Styles: ', styles);
    

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
        </header>
    )
}

type MenuItem = {
    label: string,
    path: string
}