import React, { Fragment } from 'react'
import SideMenu from './SideMenu'
import RenderModule from './RenderModule'
import { Avatar } from '@mui/material'

const Dashboard = ({ module }) => {

    return (
        <Fragment>

            <div className='flex flex-row items-start w-full'>

                {/* Sidebar menu */}

                <SideMenu />

                {/* Render Component based on folder based route */}

                <RenderModule>
                    {module}
                </RenderModule>

            </div>
        </Fragment>
    )
}

export default Dashboard