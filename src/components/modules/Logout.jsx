import React from 'react'
import Title from '../common/Title'
import Link from 'next/link'

const Logout = () => {
    return (
        <div>
            <div className='bg-[#f2f2f2] rounded-[12px] lg:p-7 p-5 shadow lg:w-[390px] m-auto flex flex-col gap-5 items-center justify-center '>
                <Title heading="Are you sure you want to exit?" />

                <div className="flex items-center gap-5 w-full justify-center">

                    <Link href="/dashboard">
                        <button className="bg-white p-2 px-7 text-black capitalize font-poppins text-base font-medium">
                            No, Cancel
                        </button>
                    </Link>

                    <Link href="/">
                        <button className="bg-black p-2 px-7 text-white capitalize font-poppins text-base font-medium">
                            Yes, Exit
                        </button>
                    </Link>

                </div>
            </div>
        </div>
    )
}

export default Logout