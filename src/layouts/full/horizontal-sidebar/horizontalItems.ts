import {
    ArchiveIcon,
    Book2Icon,
    BorderAllIcon,
    CircleIcon, FileDescriptionIcon, HomeIcon,BrandAirtableIcon

} from 'vue-tabler-icons';

export interface menu {
    header?: string;
    title?: string;
    icon?: any;
    to?: string;
    divider?: boolean;
    chip?: string;
    chipColor?: string;
    chipVariant?: string;
    chipIcon?: string;
    children?: menu[];
    disabled?: boolean;
    subCaption?: string;
    class?: string;
    extraclass?: string;
    type?: string;
    BgColor?: string;
}

const horizontalItems: menu[] = [

    // {
    //     title: "Dashboard",
    //     icon: AtomIcon,
    //     BgColor: 'primary',
    //     to: "/dashboard1",
    // },

    {
        title: 'Dashboard',
        icon: 'screencast-2-linear',
        BgColor: 'primary',
        to: '#',
        children: [
            {
                title: "Dashboard",
                to: "/dashboard",
            },
        ]
    },

    {
        title: 'Apps',
        icon: 'clapperboard-text-line-duotone',
        BgColor: 'indigo',
        to: '#',
        children: [
            {
                title: 'Chats',
                icon: CircleIcon,
                to: '/apps/chats'
            },
            {
                title: 'Blog',
                icon: CircleIcon,
                to: '/',
                children: [
                    {
                        title: 'Posts',
                        icon: CircleIcon,
                        to: '/apps/blog/posts'
                    },
                    {
                        title: 'Detail',
                        icon: CircleIcon,
                        to: '/apps/blog/early-black-friday-amazon-deals-cheap-tvs-headphones'
                    }
                ]
            },
            {
                title: 'E-Commerce',
                icon: CircleIcon,
                to: '/ecommerce/',
                children: [
                    {
                        title: 'Shop One',
                        icon: CircleIcon,
                        to: '/ecommerce/products-one'
                    },
                    {
                        title: 'Shop Two',
                        icon: CircleIcon,
                        to: '/ecommerce/products-two'
                    },
                    {
                        title: 'Details One',
                        icon: CircleIcon,
                        to: '/ecommerce/product/detail/one/1'
                    },
                    {
                        title: 'Details Two',
                        icon: CircleIcon,
                        to: '/ecommerce/product/detail/two/1'
                    },
                    {
                        title: 'List',
                        icon: CircleIcon,
                        to: '/ecommerce/productlist'
                    },
                    {
                        title: 'Checkout',
                        icon: CircleIcon,
                        to: '/ecommerce/checkout'
                    }
                ]
            },
            {
                title: 'User Profile',
                icon: CircleIcon,
                to: '/',
                children: [
                    {
                        title: 'Profile One',
                        icon: CircleIcon,
                        to: '/apps/user/profileone'
                    },
                    {
                        title: 'Profile Two',
                        icon: CircleIcon,
                        to: '/apps/user/profiletwo'
                    },
                ]
            },
            {
                title: 'Notes',
                icon: CircleIcon,
                to: '/apps/notes'
            },
            // {
            //     title: 'Calendar',
            //     icon: CircleIcon,
            //     to: '/apps/calendar'
            // },
            {
                title: 'Kanban',
                icon: CircleIcon,
                to: '/apps/kanban'
            },
        ]
    },

    {
        title: 'Pages',
        icon: 'folder-with-files-line-duotone',
        BgColor: 'error',
        to: '#',
        children: [
            {
                title: 'Pricing',
                icon: CircleIcon,
                to: '/pages/pricing'
            },
            {
                title: 'Account Setting',
                icon: CircleIcon,
                to: '/pages/account-settings'
            },
            {
                title: 'FAQ',
                icon: CircleIcon,
                to: '/pages/faq'
            },
            {
                title: 'Widget',
                icon: CircleIcon,
                to: '/widget-card',
                children: [
                    {
                        title: 'Cards',
                        icon: CircleIcon,
                        to: '/widgets/cards'
                    },
                    {
                        title: 'Banners',
                        icon: CircleIcon,
                        to: '/widgets/banners'
                    },
                    {
                        title: 'Charts',
                        icon: CircleIcon,
                        to: '/widgets/charts'
                    }
                ]
            },
            {
                title: 'UI',
                icon: CircleIcon,
                to: '#',
                children: [
                    {
                        title: 'Alert',
                        icon: CircleIcon,
                        to: '/ui-components/alert'
                    },
                    {
                        title: 'Accordion',
                        icon: CircleIcon,
                        to: '/ui-components/accordion'
                    },
                    {
                        title: 'Avatar',
                        icon: CircleIcon,
                        to: '/ui-components/avatar'
                    },
                    {
                        title: 'Chip',
                        icon: CircleIcon,
                        to: '/ui-components/chip'
                    },
                    {
                        title: 'Dialog',
                        icon: CircleIcon,
                        to: '/ui-components/dialogs'
                    },
                    {
                        title: 'List',
                        icon: CircleIcon,
                        to: '/ui-components/list'
                    },
                    {
                        title: 'Menus',
                        icon: CircleIcon,
                        to: '/ui-components/menus'
                    },
                    {
                        title: 'Rating',
                        icon: CircleIcon,
                        to: '/ui-components/rating'
                    },
                    {
                        title: 'Tabs',
                        icon: CircleIcon,
                        to: '/ui-components/tabs'
                    },
                    {
                        title: 'Tooltip',
                        icon: CircleIcon,
                        to: '/ui-components/tooltip'
                    },
                    {
                        title: 'Typography',
                        icon: CircleIcon,
                        to: '/ui-components/typography'
                    }
                ]
            },
            {
                title: 'Charts',
                icon: CircleIcon,
                to: '#',
                children: [
                    {
                        title: 'Line',
                        icon: CircleIcon,
                        to: '/charts/line-chart'
                    },
                    {
                        title: 'Gredient',
                        icon: CircleIcon,
                        to: '/charts/gredient-chart'
                    },
                    {
                        title: 'Area',
                        icon: CircleIcon,
                        to: '/charts/area-chart'
                    },
                    {
                        title: 'Candlestick',
                        icon: CircleIcon,
                        to: '/charts/candlestick-chart'
                    },
                    {
                        title: 'Column',
                        icon: CircleIcon,
                        to: '/charts/column-chart'
                    },
                    {
                        title: 'Doughnut & Pie',
                        icon: CircleIcon,
                        to: '/charts/doughnut-pie-chart'
                    },
                    {
                        title: 'Radialbar & Radar',
                        icon: CircleIcon,
                        to: '/charts/radialbar-chart'
                    }
                ]
            },
            {
                title: 'Auth',
                icon: CircleIcon,
                to: '#',
                children: [
                    {
                        title: 'Error',
                        icon: CircleIcon,
                        to: '/auth/404'
                    },
                    {
                        title: 'Maintenance',
                        icon: CircleIcon,
                        to: '/auth/maintenance'
                    },
                    {
                        title: 'Login',
                        icon: CircleIcon,
                        to: '#',
                        children: [
                            {
                                title: 'Side Login',
                                icon: CircleIcon,
                                to: '/auth/login'
                            },
                            {
                                title: 'Boxed Login',
                                icon: CircleIcon,
                                to: '/auth/login2'
                            }
                        ]
                    },
                    {
                        title: 'Register',
                        icon: CircleIcon,
                        to: '#',
                        children: [
                            {
                                title: 'Side Register',
                                icon: CircleIcon,
                                to: '/auth/register'
                            },
                            {
                                title: 'Boxed Register',
                                icon: CircleIcon,
                                to: '/auth/register2'
                            }
                        ]
                    },
                    {
                        title: 'Forgot Password',
                        icon: CircleIcon,
                        to: '#',
                        children: [
                            {
                                title: 'Side Forgot Password',
                                icon: CircleIcon,
                                to: '/auth/forgot-password'
                            },
                            {
                                title: 'Boxed Forgot Password',
                                icon: CircleIcon,
                                to: '/auth/forgot-password2'
                            }
                        ]
                    },
                    {
                        title: 'Two Steps',
                        icon: CircleIcon,
                        to: '#',
                        children: [
                            {
                                title: 'Side Two Steps',
                                icon: CircleIcon,
                                to: '/auth/two-step'
                            },
                            {
                                title: 'Boxed Two Steps',
                                icon: CircleIcon,
                                to: '/auth/two-step2'
                            }
                        ]
                    }
                ]
            },
            {
                title: 'Teachers',
                icon: CircleIcon,
                to: '',
                children: [
                    {
                        title: 'All Teachers',
                        icon: CircleIcon,
                        to: '/teachers/all-teachers'
                    },
                    {
                        title: 'Teachers Details',
                        icon: CircleIcon,
                        to: '/teachers/teachers-details'
                    }
                ]
            },
            {
                title: 'Exam',
                icon: CircleIcon,
                to: '',
                children: [
                    {
                        title: 'Exam Schedule',
                        icon: CircleIcon,
                        to: '/exam/exam-schedule'
                    },
                    {
                        title: 'Exam Result',
                        icon: CircleIcon,
                        to: '/exam/exam-result'
                    },
                    {
                        title: 'Exam Result Details',
                        icon: CircleIcon,
                        to: '/exam/exam-result-details'
                    }
                ]
            },
            {
                title: 'Students',
                icon: CircleIcon,
                to: '',
                children: [
                    {
                        title: 'All Students',
                        icon: CircleIcon,
                        to: '/students/all-students'
                    },
                    {
                        title: 'Students Details',
                        icon: CircleIcon,
                        to: '/students/students-details'
                    }
                ]
            },
            {
                title: 'Classes',
                icon: CircleIcon,
                to: '/school-pages/classes'
            },
            {
                title: 'Attendance',
                icon: CircleIcon,
                to: '/school-pages/attendance'
              },

        ]
    },
    {
        title: 'Forms',
        icon: 'file-line-duotone',
        BgColor: 'success',
        to: '#',
        children: [
            {
                title: 'Form Elements',
                icon: CircleIcon,
                to: '/components/',
                children: [
                    {
                        title: 'Autocomplete',
                        icon: CircleIcon,
                        to: '/forms/form-elements/autocomplete'
                    },
                    {
                        title: 'Combobox',
                        icon: CircleIcon,
                        to: '/forms/form-elements/combobox'
                    },
                    {
                        title: 'Button',
                        icon: CircleIcon,
                        to: '/forms/form-elements/button'
                    },
                    {
                        title: 'Checkbox',
                        icon: CircleIcon,
                        to: '/forms/form-elements/checkbox'
                    },
                    {
                        title: 'Custom Inputs',
                        icon: CircleIcon,
                        to: '/forms/form-elements/custominputs'
                    },
                    {
                        title: 'File Inputs',
                        icon: CircleIcon,
                        to: '/forms/form-elements/fileinputs'
                    },
                    {
                        title: 'Radio',
                        icon: CircleIcon,
                        to: '/forms/form-elements/radio'
                    },
                    {
                        title: 'Select',
                        icon: CircleIcon,
                        to: '/forms/form-elements/select'
                    },
                    {
                        title: 'Date Time',
                        icon: CircleIcon,
                        to: '/forms/form-elements/date-time'
                    },
                    {
                        title: 'Slider',
                        icon: CircleIcon,
                        to: '/forms/form-elements/slider'
                    },
                    {
                        title: 'Switch',
                        icon: CircleIcon,
                        to: '/forms/form-elements/switch'
                    }
                ]
            },
            {
                title: 'Form Layout',
                icon: CircleIcon,
                to: '/forms/form-layouts'
            },
            {
                title: 'Form Horizontal',
                icon: CircleIcon,
                to: '/forms/form-horizontal'
            },
            {
                title: 'Form Vertical',
                icon: CircleIcon,
                to: '/forms/form-vertical'
            },
            {
                title: 'Form Custom',
                icon: CircleIcon,
                to: '/forms/form-custom'
            },
            {
                title: 'Form Validation',
                icon: CircleIcon,
                to: '/forms/form-validation'
            }
        ]
    },
    {
        title: 'Tables',
        icon: 'layers-minimalistic-line-duotone',
        BgColor: 'warning',
        to: '#',
        children: [
            {
                title: 'Basic Table',
                icon: CircleIcon,
                to: '/tables/basic'
            },
            {
                title: 'Dark Table',
                icon: CircleIcon,
                to: '/tables/dark'
            },
            {
                title: 'Density Table',
                icon: CircleIcon,
                to: '/tables/density'
            },
            {
                title: 'Fixed Header Table',
                icon: CircleIcon,
                to: '/tables/fixed-header'
            },
            {
                title: 'Height Table',
                icon: CircleIcon,
                to: '/tables/height'
            },
            {
                title: 'Editable Table',
                icon: CircleIcon,
                to: '/tables/editable'
            },
        ]
    },
    {
        title: 'Data Tables',
        BgColor: 'secondary',
        icon: 'database-outline',
        to: '#',
        children: [
            {
                title: 'Basic Table',
                icon: CircleIcon,
                to: '/tables/datatables/basic'
            },
            {
                title: 'Header Table',
                icon: CircleIcon,
                to: '/tables/datatables/header'
            },
            {
                title: 'Selection Table',
                icon: CircleIcon,
                to: '/tables/datatables/selection'
            },
            {
                title: 'Sorting Table',
                icon: CircleIcon,
                to: '/tables/datatables/sorting'
            },
            {
                title: 'Pagination Table',
                icon: CircleIcon,
                to: '/tables/datatables/pagination'
            },
            {
                title: 'Filtering Table',
                icon: CircleIcon,
                to: '/tables/datatables/filtering'
            },
            {
                title: 'Grouping Table',
                icon: CircleIcon,
                to: '/tables/datatables/grouping'
            },
            {
                title: 'Table Slots',
                icon: CircleIcon,
                to: '/tables/datatables/slots'
            },
        ]
    }
];

export default horizontalItems;
