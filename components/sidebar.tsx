import { Database, LayoutDashboard, MessageSquare, Settings, Users, Link } from 'lucide-react';

// Inside your sidebar navigation array
const sidebarNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: 'Chat',
    href: '/chat',
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    title: 'Campaigns',
    href: '/campaigns',
    icon: <Users className="h-5 w-5" />,
  },
  // Add this new item
  {
    title: 'Connections',
    href: '/connections',
    icon: <Link className="h-5 w-5" />, // Using Link icon from lucide-react
  },
  {
    title: 'Database',
    href: '/database',
    icon: <Database className="h-5 w-5" />,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: <Settings className="h-5 w-5" />,
  },
]; 