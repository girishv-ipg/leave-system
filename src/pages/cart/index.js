import CtaButton from '@/components/common/CtaButton'
import Link from 'next/link'
import React, { Fragment, useState } from 'react'

const Cart = () => {

    const [isEmpty, setIsEmpty] = useState(true)

    const pageLinks = [
        {
            name: 'help',
            link: '#'
        },
        {
            name: 'sign in',
            link: '#'
        },

    ]


    return (
        <Fragment>

            <div className='w-full p-5'>

                <div className='lg:w-[1290px] m-auto flex items-center justify-between'>
                    <Link href="/">
                        <img src="/icons/swiggyLogo.svg" alt="swiggyLogo" className='h-12 w-12 hover:scale-[1.1] transition-all cursor-pointer' />
                    </Link>

                    <div className='lg:flex hidden items-center lg:gap-10 gap-7 lg:flex-row'>

                        {React.Children.toArray(
                            pageLinks.map(item => (
                                <Link href={item.link}>
                                    <p className='capitalize cursor-pointer text-footerDark opacity-80 hover:opacity-100 hover:text-swiggyOrange font-poppins font-medium text-base tracking-wide'>{item.name}</p>
                                </Link>
                            ))
                        )}

                    </div>

                </div>

            </div>


            {/* Cart Empty */}
            {
                isEmpty ? <div className='h-[80vh] flex flex-col items-center justify-center text-center lg:px-0 px-5'>

                    <p className='font-poppins font-bold text-[#2f2f2f] lg:text-2xl text-xl'>Your cart is empty</p>
                    <p className='font-poppins font-thin text-sm text-[#808080] mt-1'>You can go to home page to view more restaurants</p>


                    <div className='flex items-center justify-center mt-7'>
                        <CtaButton>
                            see restaurants near you
                        </CtaButton>
                    </div>

                </div> : <p>Show cart items</p>
            }

        </Fragment>
    )
}

export default Cart