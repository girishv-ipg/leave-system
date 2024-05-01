import { Skeleton } from '@mui/material'
import React from 'react'

const LoaderSkeleton = () => {
    return (
        <div className='flex flex-col h-screen p-5 lg:w-[1290px] m-auto'>

            <div className='flex items-center gap-3'>

                <Skeleton variant="circular" width={60} height={60} />

                <Skeleton variant="rectangular" width={'100%'} height={50} />

            </div>

            <div className='grid lg:grid-cols-4 grid-cols-2 gap-4 my-5'>

                {React.Children.toArray(([1, 1, 1, 1, 1, 1, 1, 1].map(item => (
                    <div>
                        <Skeleton variant="rectangular" width={'100%'} height={170} />
                        <div className='my-2'>
                            <Skeleton variant="circular" width={60} height={60} />

                            <div>
                                <Skeleton variant="text" width={'100%'} height={30} />
                                <Skeleton variant="text" width={'80%'} height={30} />
                            </div>
                        </div>
                    </div>
                ))))}

            </div>

        </div>
    )
}

export default LoaderSkeleton