import React from 'react'
import Logout from '@/components/modules/Logout'
import Dashboard from '@/components/common/Dashboard'


const index = () => {
    return (
        <Dashboard module={<Logout />} />
    )
}

export default index