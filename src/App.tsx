import { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import { NotificationsContext } from "./store/notifications-context";
import Header from "./components/layout/Header/Header";
import Home from "./components/pages/Home/Home";
import About from "./components/pages/About/About";
import Test from "./components/pages/Test/Test";
import { Notification } from "./types/notification-type";

export default function App() {

  const [unreadNotifications, setUnreadNotifications] = useState<Notification[]>([]);

  const notificationsContextValue = {
    unreadNotifications: unreadNotifications,
    markAsRead: (id: string) => {
      // Mock method
      const newNotifications = unreadNotifications.map(notification => {
        if(notification.id === id) {
          notification.status = 'read';
        }

        return notification;
      });
      setUnreadNotifications(() => {
        return newNotifications.filter(item => {
          return item.status === 'unread';
        });
      })
    },
    sendNotification: (notification: Notification) => {
      setUnreadNotifications((oldValue: Notification[]) => {
        const newNotifications = [...oldValue];
        newNotifications.push({
          id: new Date().getTime().toString(),
          ...notification,
          status: 'unread'
        });

        return newNotifications.filter(item => {
          return item.status === 'unread';
        });
      });
    }
  }

  return (
    <Router>
      <NotificationsContext.Provider value={notificationsContextValue}>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/test" element={<Test />} />
      </Routes>
      </NotificationsContext.Provider>
    </Router>
  )
}