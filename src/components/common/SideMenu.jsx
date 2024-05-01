import React from 'react'
import Logo from './Logo'
import Link from 'next/link'
import { useRouter } from 'next/router'

const menuItems = [
    {
        name: 'Dashboard',
        link: '/dashboard'
    },
    {
        name: 'Owners',
        link: '/dashboard/owners'
    },
    {
        name: 'Orders',
        link: '/dashboard/orders'
    },
    {
        name: 'Restaurants',
        link: '/dashboard/restaurants'
    },
    {
        name: 'Logout',
        link: '/dashboard/logout'
    },

]

const activeStyle = 'text-swiggyOrange bg-[#f2f2f2]'

const inActiveStyle = 'text-footerDark hover:text-swiggyOrange'

const SideMenu = () => {
    const { route } = useRouter()
    return (
        <div className='w-2/12 py-5 bg-none h-screen border-r'>
            <div className='px-5'>
                <Logo />
            </div>

            <div className='w-full'>
                <div className='mt-5 w-full flex flex-col'>
                    <hr className='bg-gray-400 border-t' />
                    {
                        React.Children.toArray(menuItems.map((item) => (
                            <Link href={item.link}>
                                <button
                                    className={`text-base text-start font-poppins font-medium capitalize bg-none p-3 tracking-wide w-full ${route === item.link ? activeStyle : inActiveStyle}`}
                                >{item.name}</button>
                            </Link>
                        )))
                    }
                </div>
            </div>
        </div>
    )
}

export default SideMenu