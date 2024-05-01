import React from 'react'
import Dashboard from '@/components/common/Dashboard'
import Restaurants from '@/components/modules/Restaurants'

const index = () => {
    return (
        <Dashboard module={<Restaurants />} />
    )
}

export default index