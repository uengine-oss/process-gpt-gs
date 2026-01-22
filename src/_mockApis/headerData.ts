// project imports
import mock from './mockAdapter';

import type { notificationType, profileType, languageType, appsLinkType, quickLinksType,searchType,optionIcon } from '@/types/HeaderTypes'
import {CircleIcon, CreditCardIcon, ShieldIcon, WalletIcon } from 'vue-tabler-icons';
// 
// Notification
// 
import user1 from '@/assets/images/profile/user1.jpg';
import user2 from '@/assets/images/profile/user2.jpg';
import user3 from '@/assets/images/profile/user3.jpg';
import user4 from '@/assets/images/profile/user4.jpg';
import user5 from '@/assets/images/profile/user5.jpg';

const notifications:notificationType[] = [
    {
        avatar: user1,
        title: 'Roman Joined the Team!',
        subtitle: 'Congratulate him',
        time:'9.08 AM'
    },
    {
        avatar: user2,
        title: 'New message received',
        subtitle: 'Salma sent you new message',
        time:'9.05 AM'
    },
    {
        avatar: user3,
        title: 'New Payment received',
        subtitle: 'Check your earnings',
        time:'10.08 AM'
    },
    {
        avatar: user4,
        title: 'Jolly completed tasks',
        subtitle: 'Assign her new tasks',
        time:'9.00 AM'
    },
    {
        avatar: user5,
        title: 'New Payment received',
        subtitle: 'Check your earnings',
        time:'9.08 AM'
    },
    {
        avatar: user1,
        title: 'Roman Joined the Team!',
        subtitle: 'Congratulate him',
        time:'9.15 AM'
    }
];

// 
// Profile 
// 

const profileDD: profileType[] = [
    {
        avatar: 'wallet-2-line-duotone',
        bgcolor:'info',
        title: 'My Profile',
        subtitle: 'Account settings',
        href: '/apps/user/profileone'
    },
    {
        avatar: 'shield-minimalistic-line-duotone',
        bgcolor:'success',
        title: 'My Inbox',
        subtitle: 'Messages & Emails',
        href: ''
    },
    {
        avatar: 'card-2-line-duotone',
        bgcolor:'error',
        title: 'My Tasks',
        subtitle: 'To-do and Daily tasks',
        href: ''
    }
];

// 
// Language
// 
import flag1 from '@/assets/images/flag/icon-flag-en.svg';
import flag2 from '@/assets/images/flag/icon-flag-fr.svg';
import flag3 from '@/assets/images/flag/icon-flag-ro.svg';
import flag4 from '@/assets/images/flag/icon-flag-zh.svg';
const languageDD: languageType[] = [
    { title: 'English', subtext: 'UK', value: 'en', avatar: flag1 },
    { title: 'français', subtext: 'French', value: 'fr', avatar: flag2 },
    { title: 'عربي', subtext: 'Arbic', value: 'ro', avatar: flag3 },
    { title: '中国人', subtext: 'Chinese', value: 'zh', avatar: flag4 }
];

// 
// AppsLink
// 
import img1 from '@/assets/images/svgs/icon-dd-chat.svg';
import img2 from '@/assets/images/svgs/icon-dd-cart.svg';
import img3 from '@/assets/images/svgs/icon-dd-invoice.svg';
import img4 from '@/assets/images/svgs/icon-dd-date.svg';
import img5 from '@/assets/images/svgs/icon-dd-mobile.svg';
import img6 from '@/assets/images/svgs/icon-dd-lifebuoy.svg';
import img7 from '@/assets/images/svgs/icon-dd-message-box.svg';
import img8 from '@/assets/images/svgs/icon-dd-application.svg';
const appsLink: appsLinkType[] = [
    {
        avatar: img1,
        title: 'Chat Application',
        subtext: 'New messages arrived',
        href: '/apps/chats'
    },
    {
        avatar: img2,
        title: 'eCommerce App',
        subtext: 'learn more information',
        href: '/ecommerce/products-one'
    },
    {
        avatar: img3,
        title: 'User Profile App',
        subtext: 'Get profile details',
        href: '/apps/user/profileone'
    },
    {
        avatar: img4,
        title: 'Calendar App',
        subtext: 'Get dates',
        href: '/apps/calendar'
    },
    {
        avatar: img5,
        title: 'Contact Application',
        subtext: '2 Unsaved Contacts',
        href: '/apps/contacts'
    },
    {
        avatar: img6,
        title: 'Account Setting App',
        subtext: 'Account settings',
        href: '/pages/account-settings'
    },
    {
        avatar: img7,
        title: 'Kanban App',
        subtext: 'Add the task',
        href: '/apps/kanban'
    },
    {
        avatar: img8,
        title: 'Notes Application',
        subtext: 'To-do and Daily tasks',
        href: '/apps/notes'
    }
];

// 
// Quick Links
// 
const quickLink: quickLinksType[] = [
    {
        title: 'Pricing Page',
        href: '/pages/pricing'
    },
    {
        title: 'Authentication Design',
        href: '/auth/login'
    },
    {
        title: 'Register Now',
        href: '/auth/register'
    },
    {
        title: '404 Error Page',
        href: '/auth/404'
    },
    {
        title: 'Notes App',
        href: '/apps/notes'
    },
    {
        title: 'User Application',
        href: '/apps/user/profileone'
    },
    {
        title: 'Blog Design',
        href: '/apps/blog/posts'
    },
    {
        title: 'Shopping Cart',
        href: '/ecommerce/checkout'
    }
];

// 
// Search Data
// 
const searchSugg: searchType[] = [
    
    {
        title: 'Contacts',
        href: '/apps/contacts'
    },
    {
        title: 'Shop',
        href: '/ecommerce/products-one'
    },
    {
        title: 'Checkout',
        href: '/ecommerce/checkout'
    },
    {
        title: 'Chats',
        href: '/apps/chats'
    },
    {
        title: 'Notes',
        href: '/apps/notes'
    },
    {
        title: 'Pricing',
        href: '/pages/pricing'
    },
    {
        title: 'Account Setting',
        href: '/pages/account-settings'
    },
];

const optionIconData:optionIcon[] = [
    {
        title: 'Applications',
        iconcolor:'primary'
    },
    {
        title: 'Form Options',
        iconcolor:'error'
    },
    {
        title: 'Table Variations',
        iconcolor:'warning'
    },
    {
        title: 'Charts Selection',
        iconcolor:'success'
    },
    {
        title: 'Widget',
        iconcolor:'indigo'
    },
]

export { notifications, profileDD, languageDD, appsLink, quickLink, searchSugg,optionIconData };

