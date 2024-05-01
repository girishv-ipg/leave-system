import CtaButton from '@/components/common/CtaButton'
import Link from 'next/link'
import React, { Fragment, useState } from 'react'

const SomethingWrong = () => {


    return (
        <Fragment>
            <div className='h-[80vh] flex flex-col items-center justify-center text-center lg:px-0 px-5'>

                <p className='font-poppins font-bold text-[#2f2f2f] lg:text-2xl text-xl'>Uh Oh!</p>
                <p className='font-poppins font-thin text-sm text-[#808080] mt-1'>Sorry! This should not have happened. Please retry.</p>


                <div className='flex items-center justify-center mt-7'>
                    <Link href="/">
                        <CtaButton>
                            Retry
                        </CtaButton>
                    </Link>
                </div>

            </div>
        </Fragment>
    )
}

export default SomethingWrong