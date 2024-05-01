import React from 'react'
import Orders from '@/components/modules/Orders'
import Dashboard from '@/components/common/Dashboard'

const index = () => {
    return (
        <Dashboard module={<Orders />} />
    )
}

export default index